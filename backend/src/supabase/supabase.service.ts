import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private anonClient: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL')?.trim();
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY')?.trim();
    const serviceRoleKey = this.configService
      .get<string>('SUPABASE_SERVICE_ROLE_KEY')
      ?.trim();

    if (url && anonKey) {
      this.anonClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      this.adminClient = serviceRoleKey
        ? createClient(url, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : this.anonClient;
      this.logger.log('Supabase PostgreSQL & Auth client initialized.');
    } else {
      this.logger.warn(
        'SUPABASE_URL / SUPABASE_ANON_KEY not set. Running in built-in CCISLSG Demo Mode.',
      );
    }
  }

  isConfigured(): boolean {
    return this.anonClient !== null;
  }

  getClient(): SupabaseClient {
    if (!this.anonClient) {
      throw new Error('Supabase client is not configured.');
    }
    return this.anonClient;
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error('Supabase admin client is not configured.');
    }
    return this.adminClient;
  }
}
