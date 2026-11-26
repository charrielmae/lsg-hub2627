import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { DemoStoreService } from '../hub/demo-store.service';

@Global()
@Module({
  providers: [SupabaseService, DemoStoreService],
  exports: [SupabaseService, DemoStoreService],
})
export class SupabaseModule {}
