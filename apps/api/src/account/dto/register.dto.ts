import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  // Not IATA name rules like passenger.dto.ts - this is an account display
  // name, not a document field.
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72) // bcrypt silently truncates beyond 72 bytes - reject earlier instead
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
