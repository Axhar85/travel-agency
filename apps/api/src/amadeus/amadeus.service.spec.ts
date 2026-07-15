import { AmadeusService } from './amadeus.service';
import type { GdsClient } from './interfaces/gds-client.interface';

describe('AmadeusService', () => {
  it('delegates every GdsClient method to whichever client is bound to GDS_CLIENT', async () => {
    const mockClient: jest.Mocked<GdsClient> = {
      searchFlights: jest.fn().mockResolvedValue([]),
      priceOffer: jest.fn().mockResolvedValue({}),
      createOrder: jest.fn().mockResolvedValue({}),
      issueTicket: jest.fn().mockResolvedValue({}),
      getOrder: jest.fn().mockResolvedValue({}),
    };
    const service = new AmadeusService(mockClient);
    const params = {
      originLocationCode: 'MAD',
      destinationLocationCode: 'JFK',
      departureDate: '2026-08-01',
      adults: 1,
    };

    await service.searchFlights(params);
    await service.priceOffer('offer-1');
    await service.createOrder('offer-1', []);
    await service.issueTicket('order-1');
    await service.getOrder('order-1');

    expect(mockClient.searchFlights).toHaveBeenCalledWith(params);
    expect(mockClient.priceOffer).toHaveBeenCalledWith('offer-1');
    expect(mockClient.createOrder).toHaveBeenCalledWith('offer-1', []);
    expect(mockClient.issueTicket).toHaveBeenCalledWith('order-1');
    expect(mockClient.getOrder).toHaveBeenCalledWith('order-1');
  });
});
