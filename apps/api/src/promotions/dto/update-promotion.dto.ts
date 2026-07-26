import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
