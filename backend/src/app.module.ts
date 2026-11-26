import { Module, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { SupabaseService } from './supabase/supabase.service';
import { AuthModule } from './auth/auth.module';
import { HubModule } from './hub/hub.module';

@Controller('health')
class HealthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'CCISLSG Hub API',
      authMode: this.supabaseService.isConfigured() ? 'supabase' : 'demo',
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    AuthModule,
    HubModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
