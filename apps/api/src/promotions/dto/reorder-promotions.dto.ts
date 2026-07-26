import { IsArray, IsUUID } from 'class-validator';

export class ReorderPromotionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
