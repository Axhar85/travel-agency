import { IsArray, IsUUID } from 'class-validator';

export class ReorderDestinationCardsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
