import { validate } from 'class-validator';
import { IsGdsOfferId } from './is-gds-offer-id.decorator';
import { decodeOfferId, encodeOfferId } from './offer-id';

const UUID = '1a9ca206-b138-4ed3-92f8-06858817aca3';

describe('offer ids', () => {
  it('round-trips a provider and native id', () => {
    const encoded = encodeOfferId('travelport', UUID);

    expect(encoded).toBe(`travelport.${UUID}`);
    expect(decodeOfferId(encoded)).toEqual({
      provider: 'travelport',
      nativeId: UUID,
    });
  });

  it('treats an unprefixed id as a legacy Amadeus offer', () => {
    expect(decodeOfferId(UUID)).toEqual({
      provider: 'amadeus',
      nativeId: UUID,
    });
  });

  it('does not treat an unknown prefix as a provider', () => {
    // Falls through to the legacy default rather than inventing a provider.
    expect(decodeOfferId('sabre.abc')).toEqual({
      provider: 'amadeus',
      nativeId: 'sabre.abc',
    });
  });
});

describe('IsGdsOfferId', () => {
  class Dto {
    @IsGdsOfferId()
    offerId: string;
  }

  async function isValid(offerId: string): Promise<boolean> {
    const dto = new Dto();
    dto.offerId = offerId;
    return (await validate(dto)).length === 0;
  }

  it('accepts a provider-prefixed uuid', async () => {
    expect(await isValid(`amadeus.${UUID}`)).toBe(true);
    expect(await isValid(`travelport.${UUID}`)).toBe(true);
  });

  it('still accepts a bare uuid so in-flight legacy ids keep working', async () => {
    expect(await isValid(UUID)).toBe(true);
  });

  it('rejects unknown providers, non-uuids, and junk', async () => {
    expect(await isValid(`sabre.${UUID}`)).toBe(false);
    expect(await isValid('amadeus.not-a-uuid')).toBe(false);
    expect(await isValid('')).toBe(false);
    expect(await isValid(`${UUID}.extra`)).toBe(false);
  });
});
