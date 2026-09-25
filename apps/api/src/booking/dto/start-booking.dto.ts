import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsGdsOfferId } from '../../gds/is-gds-offer-id.decorator';

export class StartBookingDto {
  @IsGdsOfferId()
  offerId: string;

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
  infants?: number;
}
