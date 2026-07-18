import { IsString, IsUUID } from 'class-validator';

export class PriceOfferParamsDto {
  @IsString()
  @IsUUID()
  offerId: string;
}
