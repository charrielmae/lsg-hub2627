import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { DemoStoreService } from '../hub/demo-store.service';
import {
  AuthenticatedUser,
  CollegeRecord,
  OrgType,
  StudentProfileRecord,
  UserRecord,
} from '../hub/erd.types';
import { CaptchaService } from './captcha.service';
import { LoginDto } from './dto/login.dto';
import { verifyPasswordHash } from './password.util';

export type UserProfile = AuthenticatedUser;

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly demoStore: DemoStoreService,
    private readonly jwtService: JwtService,
    private readonly captchaService: CaptchaService,
  ) {}

  async login(dto: LoginDto) {
    await this.captchaService.verifyChallenge(
      dto.captchaToken,
      dto.captchaAnswer,
    );

    const identifier = dto.identifier.trim();

    if (this.supabaseService.isConfigured()) {
      return this.loginWithSupabase(identifier, dto.password);
    }

    return this.loginWithDemo(identifier, dto.password);
  }

  private async loginWithSupabase(identifier: string, password: string) {
    const admin = this.supabaseService.getAdminClient();
    const client = this.supabaseService.getClient();

    let userRow: UserRecord | null = null;

    if (identifier.includes('@')) {
      const { data } = await admin
        .from('users')
        .select('*')
        .ilike('email', identifier)
        .maybeSingle();
      userRow = (data as UserRecord | null) ?? null;
    } else {
      // Try username first, then student_profiles.student_no
      const { data: byUsername } = await admin
        .from('users')
        .select('*')
        .ilike('username', identifier)
        .maybeSingle();

      if (byUsername) {
        userRow = byUsername as UserRecord;
      } else {
        const { data: profileLookup } = await admin
          .from('student_profiles')
          .select('user_id')
          .ilike('student_no', identifier)
          .maybeSingle();

        if (profileLookup?.user_id) {
          const { data: byProfile } = await admin
            .from('users')
            .select('*')
            .eq('id', profileLookup.user_id)
            .maybeSingle();
          userRow = (byProfile as UserRecord | null) ?? null;
        }
      }
    }

    if (!userRow) {
      throw new UnauthorizedException(
        'Invalid Email, Username, Student No., or password.',
      );
    }

    if (!userRow.is_active) {
      throw new ForbiddenException('This constituent account is inactive.');
    }

    let authenticated = false;
    if (userRow.password_hash) {
      authenticated = verifyPasswordHash(password, userRow.password_hash);
    }

    // Fallback to Supabase Auth if account is also registered in auth.users
    if (!authenticated) {
      const { data, error } = await client.auth.signInWithPassword({
        email: userRow.email,
        password,
      });
      if (!error && data.user) {
        authenticated = true;
      }
    }

    if (!authenticated) {
      throw new UnauthorizedException('Invalid credentials provided.');
    }

    const user = await this.hydrateSupabaseUser(userRow);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      mode: 'supabase',
    });

    return {
      accessToken,
      mode: 'supabase' as const,
      user,
    };
  }

  private async loginWithDemo(identifier: string, password: string) {
    const normalized = identifier.toLowerCase();

    const matchedProfile = this.demoStore.studentProfiles.find(
      (sp) => sp.student_no?.toLowerCase() === normalized,
    );

    const userRow = this.demoStore.users.find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        u.username?.toLowerCase() === normalized ||
        (matchedProfile && u.id === matchedProfile.user_id),
    );

    if (!userRow || !verifyPasswordHash(password, userRow.password_hash)) {
      throw new UnauthorizedException(
        'Invalid credentials. Please check your email/username/Student No. and password.',
      );
    }

    if (!userRow.is_active) {
      throw new ForbiddenException('This constituent account is inactive.');
    }

    const user = this.demoStore.buildAuthenticatedUser(userRow);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      mode: 'demo',
    });

    return {
      accessToken,
      mode: 'demo' as const,
      user,
    };
  }

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: string;
        purpose?: string;
      }>(token);

      if (!payload.sub || payload.purpose === 'captcha') {
        throw new UnauthorizedException('Invalid session token');
      }

      if (this.supabaseService.isConfigured()) {
        const admin = this.supabaseService.getAdminClient();
        const { data } = await admin
          .from('users')
          .select('*')
          .eq('id', payload.sub)
          .maybeSingle();

        if (!data) {
          throw new UnauthorizedException('User record not found');
        }
        return this.hydrateSupabaseUser(data as UserRecord);
      }

      const account = this.demoStore.users.find((u) => u.id === payload.sub);
      if (!account) {
        throw new UnauthorizedException('Demo user not found');
      }
      return this.demoStore.buildAuthenticatedUser(account);
    } catch {
      if (this.supabaseService.isConfigured()) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client.auth.getUser(token);
        if (!error && data.user?.email) {
          const admin = this.supabaseService.getAdminClient();
          const { data: userRow } = await admin
            .from('users')
            .select('*')
            .ilike('email', data.user.email)
            .maybeSingle();
          if (userRow) {
            return this.hydrateSupabaseUser(userRow as UserRecord);
          }
        }
      }
      throw new UnauthorizedException('Session expired or invalid token');
    }
  }

  async hydrateSupabaseUser(userRow: UserRecord): Promise<AuthenticatedUser> {
    const admin = this.supabaseService.getAdminClient();

    const [collegeRes, profileRes, officerRes] = await Promise.all([
      userRow.college_id
        ? admin
            .from('colleges')
            .select('id, code, name')
            .eq('id', userRow.college_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from('student_profiles')
        .select('*')
        .eq('user_id', userRow.id)
        .maybeSingle(),
      admin
        .from('org_officers')
        .select('organization_id, organizations(id, name, type)')
        .eq('user_id', userRow.id),
    ]);

    const officerOrganizations = (officerRes.data || [])
      .map((row: Record<string, unknown>) => {
        const org = Array.isArray(row.organizations)
          ? row.organizations[0]
          : row.organizations;
        if (!org || typeof org !== 'object') return null;
        const typed = org as { id: string; name: string; type: OrgType };
        return {
          id: typed.id,
          name: typed.name,
          type: typed.type,
        };
      })
      .filter(
        (item): item is { id: string; name: string; type: OrgType } =>
          item !== null,
      );

    return {
      id: userRow.id,
      email: userRow.email,
      username: userRow.username,
      fullName: userRow.full_name,
      googleId: userRow.google_id,
      role: userRow.role,
      isActive: userRow.is_active,
      createdAt: userRow.created_at,
      college: (collegeRes.data as CollegeRecord | null) ?? null,
      studentProfile: (profileRes.data as StudentProfileRecord | null) ?? null,
      officerOrganizations,
    };
  }

  getDemoAccountsSummary() {
    if (this.supabaseService.isConfigured()) {
      return {
        mode: 'supabase' as const,
        accounts: [],
      };
    }

    return {
      mode: 'demo' as const,
      accounts: this.demoStore.users.slice(0, 2).map((u) => {
        const sp = this.demoStore.studentProfiles.find(
          (p) => p.user_id === u.id,
        );
        return {
          email: u.email,
          username: u.username,
          studentNo: sp?.student_no ?? null,
          password: 'password123',
          role: u.role,
          fullName: u.full_name,
        };
      }),
    };
  }
}
