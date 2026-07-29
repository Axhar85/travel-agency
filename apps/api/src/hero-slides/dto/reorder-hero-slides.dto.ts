import { IsArray, IsUUID } from 'class-validator';

export class ReorderHeroSlidesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
