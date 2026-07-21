import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { parseUtcTimestamp, todayUtcMidnight } from '../../common/date.utils';

export enum CabinClassDto {
  ECONOMY = 'ECONOMY',
  PREMIUM_ECONOMY = 'PREMIUM_ECONOMY',
  BUSINESS = 'BUSINESS',
  FIRST = 'FIRST',
}

function toUppercase({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.toUpperCase() : value;
}

@ValidatorConstraint({ name: 'IsTodayOrFuture', async: false })
class IsTodayOrFutureConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') return false;
    const parsed = parseUtcTimestamp(value);
    return parsed !== null && parsed >= todayUtcMidnight();
  }
  defaultMessage(): string {
    return 'departureDate must not be in the past';
  }
}

@ValidatorConstraint({ name: 'IsAfterDeparture', async: false })
class IsAfterDepartureConstraint implements ValidatorConstraintInterface {
  validate(value: string | undefined, args: ValidationArguments): boolean {
    if (!value) return true;
    const dto = args.object as SearchFlightsQueryDto;
    return new Date(value) > new Date(dto.departureDate);
  }
  defaultMessage(): string {
    return 'returnDate must be after departureDate';
  }
}

@ValidatorConstraint({ name: 'IsDifferentAirport', async: false })
class IsDifferentAirportConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const dto = args.object as SearchFlightsQueryDto;
    return typeof value === 'string' && value !== dto.origin;
  }
  defaultMessage(): string {
    return 'destination must be different from origin';
  }
}

@ValidatorConstraint({ name: 'InfantsNotExceedAdults', async: false })
class InfantsNotExceedAdultsConstraint implements ValidatorConstraintInterface {
  validate(value: number | undefined, args: ValidationArguments): boolean {
    if (value === undefined) return true;
    const dto = args.object as SearchFlightsQueryDto;
    return value <= dto.adults;
  }
  defaultMessage(): string {
    return 'infants cannot exceed adults (each infant must travel with an adult)';
  }
}

const IATA_CODE_PATTERN = /^[A-Za-z]{3}$/;

export class SearchFlightsQueryDto {
  @IsString()
  @Matches(IATA_CODE_PATTERN, {
    message: 'origin must be a 3-letter IATA airport code',
  })
  @Transform(toUppercase)
  origin: string;

  @IsString()
  @Matches(IATA_CODE_PATTERN, {
    message: 'destination must be a 3-letter IATA airport code',
  })
  @Transform(toUppercase)
  @Validate(IsDifferentAirportConstraint)
  destination: string;

  @IsDateString()
  @Validate(IsTodayOrFutureConstraint)
  departureDate: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsAfterDepartureConstraint)
  returnDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  adults: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9)
  children?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9)
  @Validate(InfantsNotExceedAdultsConstraint)
  infants?: number;

  @IsOptional()
  @IsIn(Object.values(CabinClassDto))
  cabinClass?: CabinClassDto;

  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  @IsBoolean()
  nonStop?: boolean;

  @IsOptional()
  @IsString()
  @Matches(IATA_CODE_PATTERN)
  @Transform(toUppercase)
  currencyCode?: string;
}
