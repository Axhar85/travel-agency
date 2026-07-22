import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { PassengerDto } from './passenger.dto';

export class SubmitPassengersDto {
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  @ArrayMinSize(1)
  passengers: PassengerDto[];
}
