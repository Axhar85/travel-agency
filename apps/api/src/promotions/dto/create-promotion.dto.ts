import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreatePromotionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;
}
