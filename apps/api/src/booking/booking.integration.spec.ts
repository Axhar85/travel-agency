import { Global, INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import session from 'express-session';
import request from 'supertest';
import { AmadeusService } from '../amadeus/amadeus.service';
import { PricedOffer } from '../amadeus/interfaces/gds-client.interface';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { RedisSessionStore } from '../session/redis-session.store';
import { BookingModule } from './booking.module';

// AmadeusModule's internal provider graph (AmadeusAuthService,
// OfferCacheService, ...) still gets instantiated even though the test below
// overrides the exported AmadeusService - overriding a provider doesn't skip
// building its module's other providers. None of them are ever actually
// *called* here (only AmadeusService is used, and it's fully mocked), so a
// fake in-memory REDIS_CLIENT is enough; no real Redis connection needed.
@Global()
@Module({})
class FakeRedisModule {
  static forRoot(client: unknown) {
    return {
      module: FakeRedisModule,
      providers: [{ provide: REDIS_CLIENT, useValue: client }],
      exports: [REDIS_CLIENT],
    };
  }
}

/**
 * Exercises the real HTTP request cycle (session middleware -> cookie ->
 * BookingController -> BookingService -> session store), rather than the
 * mocked-session unit tests in booking.service.spec.ts / booking.controller
 * .spec.ts. This is the only place that actually proves a booking survives
 * across two separate requests via the session cookie, the way a browser
 * would use it - Redis is faked in-memory (a Map) rather than mocked at the
 * call level, so the real RedisSessionStore get/set/serialize path runs too.
 */
describe('Booking session (integration)', () => {
  let app: INestApplication;

  const pricedOffer: PricedOffer = {
    id: 'offer-1',
    contentSource: 'GDS',
    itineraries: [],
    price: { currency: 'EUR', total: '199.99', base: '150.00' },
    validatingAirlineCodes: ['IB'],
    priceChanged: false,
    originalTotal: '199.99',
  };

  beforeEach(async () => {
    const store = new Map<string, string>();
    const fakeRedis = {
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
      expire: jest.fn(async () => 1),
    } as any;

    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        FakeRedisModule.forRoot(fakeRedis),
        BookingModule,
      ],
    })
      .overrideProvider(AmadeusService)
      .useValue({ priceOffer: jest.fn().mockResolvedValue(pricedOffer) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(
      session({
        store: new RedisSessionStore(fakeRedis, 1800),
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false, sameSite: 'lax' },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('persists a booking across requests via the session cookie', async () => {
    const agent = request.agent(app.getHttpServer());

    const startResponse = await agent
      .post('/booking/start')
      .send({ offerId: '1a9ca206-b138-4ed3-92f8-06858817aca3', adults: 1 })
      .expect(201);
    expect(startResponse.body.step).toBe('passengers');
    expect(startResponse.headers['set-cookie']).toBeDefined();

    // Same agent = cookie jar carried forward, like a real browser tab.
    const stateResponse = await agent.get('/booking/state').expect(200);
    expect(stateResponse.body.pricedOffer.id).toBe('offer-1');
  });

  it('rejects /booking/state for a client with no session cookie at all', async () => {
    await request(app.getHttpServer()).get('/booking/state').expect(404);
  });

  it('does not leak one client’s booking session to another', async () => {
    const agentA = request.agent(app.getHttpServer());
    const agentB = request.agent(app.getHttpServer());

    await agentA
      .post('/booking/start')
      .send({ offerId: '1a9ca206-b138-4ed3-92f8-06858817aca3', adults: 1 })
      .expect(201);

    // agentB never called /booking/start - it must not see agentA's session.
    await agentB.get('/booking/state').expect(404);
  });
});
