import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PassengerDto } from './passenger.dto';

const validAdult = {
  type: 'ADULT',
  firstName: 'John',
  lastName: "O'Brien-Smith",
  dateOfBirth: '1990-05-15',
  gender: 'MALE',
  email: 'john@example.com',
  phone: '+34 600 123 456',
  document: {
    documentType: 'PASSPORT',
    number: 'AB123456',
    expiryDate: '2030-01-01',
    issuanceCountry: 'ES',
    nationality: 'ES',
    holder: true,
  },
};

function validate(raw: Record<string, unknown>) {
  const dto = plainToInstance(PassengerDto, raw);
  return validateSync(dto);
}

describe('PassengerDto', () => {
  it('accepts a fully valid adult passenger', () => {
    expect(validate(validAdult)).toHaveLength(0);
  });

  it('accepts a valid child passenger without email/phone', () => {
    const child = {
      ...validAdult,
      type: 'CHILD',
      email: undefined,
      phone: undefined,
      document: undefined,
    };
    delete child.email;
    delete child.phone;
    delete child.document;

    expect(validate(child)).toHaveLength(0);
  });

  it('rejects a first name with digits (not IATA format)', () => {
    const errors = validate({ ...validAdult, firstName: 'John3' });
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it('rejects a first name with accented characters', () => {
    const errors = validate({ ...validAdult, firstName: 'José' });
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });

  it('rejects a dateOfBirth in the future', () => {
    const errors = validate({ ...validAdult, dateOfBirth: '2099-01-01' });
    expect(errors.some((e) => e.property === 'dateOfBirth')).toBe(true);
  });

  it('rejects an adult passenger missing email', () => {
    const adult = { ...validAdult, email: undefined };
    delete adult.email;
    const errors = validate(adult);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects an adult passenger missing phone', () => {
    const adult = { ...validAdult, phone: undefined };
    delete adult.phone;
    const errors = validate(adult);
    expect(errors.some((e) => e.property === 'phone')).toBe(true);
  });

  it('rejects an invalid email format when provided for a child', () => {
    const child = { ...validAdult, type: 'CHILD', email: 'not-an-email' };
    const errors = validate(child);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('rejects a passport expiryDate in the past', () => {
    const errors = validate({
      ...validAdult,
      document: { ...validAdult.document, expiryDate: '2020-01-01' },
    });
    const documentErrors = errors.find((e) => e.property === 'document');
    expect(documentErrors).toBeDefined();
  });

  it('rejects a non-ISO issuanceCountry', () => {
    const errors = validate({
      ...validAdult,
      document: { ...validAdult.document, issuanceCountry: 'ESP' },
    });
    const documentErrors = errors.find((e) => e.property === 'document');
    expect(documentErrors).toBeDefined();
  });

  it('rejects an invalid gender value', () => {
    const errors = validate({ ...validAdult, gender: 'OTHER' });
    expect(errors.some((e) => e.property === 'gender')).toBe(true);
  });
});
