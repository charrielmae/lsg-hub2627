import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService, UserProfile } from './auth.service';
import { CaptchaService } from './captcha.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Get('status')
  getStatus() {
    return this.authService.getDemoAccountsSummary();
  }

  @Get('captcha')
  getCaptcha() {
    return this.captchaService.createChallenge();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(@Req() req: { user: UserProfile }) {
    return {
      user: req.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return { success: true };
  }
}
