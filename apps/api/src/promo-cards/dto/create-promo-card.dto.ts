import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePromoCardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titleEs: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titleEn: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  subtitleEs: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  subtitleEn: string;

  // Deliberately @IsString, not @IsUrl - this is a relative in-app path
  // (e.g. "/hajj-umrah" or "/search?origin=MAD&destination=LHE&...").
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  linkUrl: string;
}
