import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HubController } from './hub.controller';
import { HubService } from './hub.service';

@Module({
  imports: [AuthModule],
  controllers: [HubController],
  providers: [HubService],
})
export class HubModule {}
