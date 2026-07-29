import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateHeroSlideDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titleEs?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titleEn?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  subtitleEs?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  subtitleEn?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  linkUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
