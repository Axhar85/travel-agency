import { IsArray, IsUUID } from 'class-validator';

export class ReorderPromoCardsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
