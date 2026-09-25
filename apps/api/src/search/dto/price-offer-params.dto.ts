import { IsString } from 'class-validator';
import { IsGdsOfferId } from '../../gds/is-gds-offer-id.decorator';

export class PriceOfferParamsDto {
  @IsString()
  @IsGdsOfferId()
  offerId: string;
}
