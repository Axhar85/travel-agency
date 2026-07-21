import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { parseUtcTimestamp, todayUtcMidnight } from '../../common/date.utils';

const NAME_PATTERN = /^[A-Za-z\s'-]{1,50}$/;
const ISO_COUNTRY_PATTERN = /^[A-Za-z]{2}$/;
const PASSPORT_NUMBER_PATTERN = /^[A-Za-z0-9]{5,20}$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

@ValidatorConstraint({ name: 'IsPastDate', async: false })
class IsPastDateConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') return false;
    const parsed = parseUtcTimestamp(value);
    return parsed !== null && parsed < todayUtcMidnight();
  }
  defaultMessage(): string {
    return 'dateOfBirth must be in the past';
  }
}

@ValidatorConstraint({ name: 'IsFutureDate', async: false })
class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') return false;
    const parsed = parseUtcTimestamp(value);
    return parsed !== null && parsed > todayUtcMidnight();
  }
  defaultMessage(): string {
    return 'expiryDate must be in the future';
  }
}

export class PassengerDocumentDto {
  @IsIn(['PASSPORT'])
  documentType: 'PASSPORT';

  @IsString()
  @Matches(PASSPORT_NUMBER_PATTERN, {
    message: 'number must be 5-20 alphanumeric characters',
  })
  number: string;

  @IsString()
  @Validate(IsFutureDateConstraint)
  expiryDate: string;

  @IsString()
  @Matches(ISO_COUNTRY_PATTERN, {
    message: 'issuanceCountry must be a 2-letter ISO country code',
  })
  issuanceCountry: string;

  @IsString()
  @Matches(ISO_COUNTRY_PATTERN, {
    message: 'nationality must be a 2-letter ISO country code',
  })
  nationality: string;

  @IsBoolean()
  holder: boolean;
}

export class PassengerDto {
  @IsIn(['ADULT', 'CHILD', 'INFANT'])
  type: 'ADULT' | 'CHILD' | 'INFANT';

  @IsString()
  @Matches(NAME_PATTERN, {
    message: 'firstName must be 1-50 letters (IATA format, no accents/numbers)',
  })
  firstName: string;

  @IsString()
  @Matches(NAME_PATTERN, {
    message: 'lastName must be 1-50 letters (IATA format, no accents/numbers)',
  })
  lastName: string;

  @IsString()
  @Validate(IsPastDateConstraint)
  dateOfBirth: string;

  @IsIn(['MALE', 'FEMALE'])
  gender: 'MALE' | 'FEMALE';

  // Required (and format-checked) for adults - @IsEmail() rejects a missing
  // value, so gating on type alone is enough to make it required. Optional
  // for children/infants, but format-checked if one is provided anyway.
  @ValidateIf((dto: PassengerDto) => dto.type === 'ADULT' || !!dto.email)
  @IsEmail()
  email?: string;

  @ValidateIf((dto: PassengerDto) => dto.type === 'ADULT' || !!dto.phone)
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'phone must be a valid phone number' })
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PassengerDocumentDto)
  document?: PassengerDocumentDto;
}
