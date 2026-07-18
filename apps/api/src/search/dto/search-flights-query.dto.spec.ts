import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SearchFlightsQueryDto } from './search-flights-query.dto';

function validate(raw: Record<string, unknown>) {
  const dto = plainToInstance(SearchFlightsQueryDto, raw, {
    enableImplicitConversion: true,
  });
  return validateSync(dto);
}

const validQuery = {
  origin: 'mad',
  destination: 'jfk',
  departureDate: '2026-08-01',
  adults: '1',
};

describe('SearchFlightsQueryDto', () => {
  it('accepts a valid one-way search and uppercases airport codes', () => {
    const dto = plainToInstance(SearchFlightsQueryDto, validQuery, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.origin).toBe('MAD');
    expect(dto.destination).toBe('JFK');
  });

  it('accepts a valid round-trip search', () => {
    const errors = validate({ ...validQuery, returnDate: '2026-08-10' });

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-IATA origin code', () => {
    const errors = validate({ ...validQuery, origin: 'MADRID' });

    expect(errors.some((e) => e.property === 'origin')).toBe(true);
  });

  it('rejects when destination equals origin', () => {
    const errors = validate({ ...validQuery, destination: 'MAD' });

    expect(errors.some((e) => e.property === 'destination')).toBe(true);
  });

  it('rejects a departureDate in the past', () => {
    const errors = validate({ ...validQuery, departureDate: '2020-01-01' });

    expect(errors.some((e) => e.property === 'departureDate')).toBe(true);
  });

  it('rejects a returnDate that is not after departureDate', () => {
    const errors = validate({ ...validQuery, returnDate: '2026-08-01' });

    expect(errors.some((e) => e.property === 'returnDate')).toBe(true);
  });

  it('rejects more infants than adults', () => {
    const errors = validate({ ...validQuery, adults: '1', infants: '2' });

    expect(errors.some((e) => e.property === 'infants')).toBe(true);
  });

  it('accepts infants equal to adults', () => {
    const errors = validate({ ...validQuery, adults: '2', infants: '2' });

    expect(errors).toHaveLength(0);
  });

  it('rejects adults outside 1-9', () => {
    expect(
      validate({ ...validQuery, adults: '0' }).some(
        (e) => e.property === 'adults',
      ),
    ).toBe(true);
    expect(
      validate({ ...validQuery, adults: '10' }).some(
        (e) => e.property === 'adults',
      ),
    ).toBe(true);
  });

  it('rejects an invalid cabinClass', () => {
    const errors = validate({ ...validQuery, cabinClass: 'FIRST_PLUS' });

    expect(errors.some((e) => e.property === 'cabinClass')).toBe(true);
  });

  it('coerces nonStop from a query-string boolean', () => {
    const dto = plainToInstance(
      SearchFlightsQueryDto,
      { ...validQuery, nonStop: 'true' },
      { enableImplicitConversion: true },
    );

    expect(dto.nonStop).toBe(true);
    expect(validateSync(dto)).toHaveLength(0);
  });

  describe('departureDate "today or future" check is timezone-independent', () => {
    const originalTz = process.env.TZ;

    afterEach(() => {
      process.env.TZ = originalTz;
    });

    it('accepts today (UTC) under an extreme negative server-timezone offset', () => {
      const todayUtc = new Date().toISOString().slice(0, 10);
      process.env.TZ = 'Etc/GMT+11'; // UTC-11

      const errors = validate({ ...validQuery, departureDate: todayUtc });

      expect(errors.some((e) => e.property === 'departureDate')).toBe(false);
    });

    it('accepts today (UTC) under an extreme positive server-timezone offset', () => {
      const todayUtc = new Date().toISOString().slice(0, 10);
      process.env.TZ = 'Pacific/Kiritimati'; // UTC+14

      const errors = validate({ ...validQuery, departureDate: todayUtc });

      expect(errors.some((e) => e.property === 'departureDate')).toBe(false);
    });

    it('still rejects yesterday (UTC) under an extreme negative server-timezone offset', () => {
      const yesterdayUtc = new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      process.env.TZ = 'Etc/GMT+11'; // UTC-11

      const errors = validate({ ...validQuery, departureDate: yesterdayUtc });

      expect(errors.some((e) => e.property === 'departureDate')).toBe(true);
    });
  });
});
