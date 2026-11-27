import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Email, Username, or Officer ID is required' })
  identifier: string;

  @IsString()
  @MinLength(3, { message: 'Password must be at least 3 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'CAPTCHA token is required' })
  captchaToken: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter the CAPTCHA code' })
  captchaAnswer: string;
}

export class StudentLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Student ID Number is required' })
  studentNo: string;

  @IsString()
  @IsNotEmpty({ message: 'CAPTCHA token is required' })
  captchaToken: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter the CAPTCHA code' })
  captchaAnswer: string;
}
