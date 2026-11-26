import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Email or Student ID is required' })
  identifier: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'CAPTCHA token is required' })
  captchaToken: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter the CAPTCHA code' })
  captchaAnswer: string;
}
