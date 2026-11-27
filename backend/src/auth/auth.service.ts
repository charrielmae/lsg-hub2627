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
  Program,
  StudentMasterRecord,
  StudentProfileRecord,
  UserRecord,
} from '../hub/erd.types';
import { CaptchaService } from './captcha.service';
import { LoginDto, StudentLoginDto } from './dto/login.dto';
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

  async loginStudentById(dto: StudentLoginDto) {
    await this.captchaService.verifyChallenge(
      dto.captchaToken,
      dto.captchaAnswer,
    );

    const studentNo = dto.studentNo.trim();

    if (this.supabaseService.isConfigured()) {
      return this.loginStudentWithSupabase(studentNo);
    }

    return this.loginStudentWithDemo(studentNo);
  }

  private async loginStudentWithSupabase(studentNo: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: studentMaster } = await admin
      .from('students')
      .select('*')
      .ilike('student_no', studentNo)
      .maybeSingle();

    const master = (studentMaster as StudentMasterRecord | null) ?? null;

    let userRow: UserRecord | null = null;

    // 1. Check linked user_id on public.students or public.student_profiles
    if (master?.user_id) {
      const { data } = await admin
        .from('users')
        .select('*')
        .eq('id', master.user_id)
        .maybeSingle();
      userRow = (data as UserRecord | null) ?? null;
    }

    if (!userRow) {
      const { data: profileLookup } = await admin
        .from('student_profiles')
        .select('user_id')
        .ilike('student_no', studentNo)
        .maybeSingle();

      if (profileLookup?.user_id) {
        const { data } = await admin
          .from('users')
          .select('*')
          .eq('id', profileLookup.user_id)
          .maybeSingle();
        userRow = (data as UserRecord | null) ?? null;
      }
    }

    // 2. If present in public.students but no user row yet, provision student account
    if (!userRow && master) {
      if (!master.is_active) {
        throw new ForbiddenException('This student record is inactive.');
      }

      const email = `${master.student_no.toLowerCase()}@carsu.edu.ph`;
      const { data: existingByEmail } = await admin
        .from('users')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (existingByEmail) {
        userRow = existingByEmail as UserRecord;
      } else {
        const { data: createdUser, error: createErr } = await admin
          .from('users')
          .insert({
            email,
            username: master.student_no,
            full_name: master.full_name,
            role: 'STUDENT',
            college_id: master.college_id,
            is_active: true,
            password_hash: null,
          })
          .select('*')
          .single();

        if (createErr || !createdUser) {
          throw new UnauthorizedException(
            createErr?.message || 'Unable to provision student session.',
          );
        }
        userRow = createdUser as UserRecord;
      }

      await admin.from('student_profiles').upsert(
        {
          user_id: userRow.id,
          student_no: master.student_no,
          region_code: '160000000',
          region_name: 'Caraga Region (Region XIII)',
          province_code: '160200000',
          province_name: 'Agusan del Norte',
          city_code: '8600',
          city_name: 'Butuan City',
          barangay_code: '160202003',
          barangay_name: 'Ampayon',
        },
        { onConflict: 'user_id' },
      );

      await admin
        .from('students')
        .update({ user_id: userRow.id })
        .eq('id', master.id);

      const { data: existingMem } = await admin
        .from('memberships')
        .select('id')
        .eq('user_id', userRow.id)
        .eq('organization_id', master.organization_id)
        .maybeSingle();

      if (!existingMem) {
        await admin.from('memberships').insert({
          user_id: userRow.id,
          organization_id: master.organization_id,
          status: 'APPROVED',
          remarks: `Designated via ${master.program} (${master.year_level} Year) orientation masterlist.`,
        });
      }
    }

    if (!userRow) {
      throw new UnauthorizedException(
        'Student ID Number not found in the CCIS enrollment roster (e.g. 261-01458).',
      );
    }

    if (userRow.role !== 'STUDENT') {
      throw new UnauthorizedException(
        'Officer and Governor accounts require a password. Please sign in at the Officer Portal.',
      );
    }

    if (!userRow.is_active) {
      throw new ForbiddenException('This student account is inactive.');
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

  private async loginStudentWithDemo(studentNo: string) {
    const userRow = this.demoStore.ensureUserForStudent(studentNo);

    if (!userRow) {
      throw new UnauthorizedException(
        'Student ID Number not found in the CCIS roster. Try e.g. 261-01458 (BSIT), 261-01645 (BSIS), or 261-02974 (BSCS).',
      );
    }

    if (userRow.role !== 'STUDENT') {
      throw new UnauthorizedException(
        'Officer and Governor accounts require a password. Please sign in at the Officer Portal.',
      );
    }

    if (!userRow.is_active) {
      throw new ForbiddenException('This student account is inactive.');
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
        'Invalid Email, Username, Officer ID, or password.',
      );
    }

    if (!userRow.is_active) {
      throw new ForbiddenException('This account is inactive.');
    }

    let authenticated = false;
    if (userRow.password_hash) {
      authenticated = verifyPasswordHash(password, userRow.password_hash);
    }

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
        'Invalid officer credentials. Please check your email/username and password.',
      );
    }

    if (!userRow.is_active) {
      throw new ForbiddenException('This account is inactive.');
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

    const studentProfile =
      (profileRes.data as StudentProfileRecord | null) ?? null;

    let studentEnrollment: AuthenticatedUser['studentEnrollment'] = null;
    if (studentProfile?.student_no) {
      const { data: studentMaster } = await admin
        .from('students')
        .select('program, year_level, organization_id, organizations(name)')
        .ilike('student_no', studentProfile.student_no)
        .maybeSingle();

      if (studentMaster) {
        const rawOrg = (studentMaster as Record<string, unknown>).organizations;
        const orgObj = Array.isArray(rawOrg) ? rawOrg[0] : rawOrg;
        studentEnrollment = {
          program: studentMaster.program as Program,
          yearLevel: studentMaster.year_level as string,
          organizationId: studentMaster.organization_id as string,
          organizationName:
            (orgObj as { name?: string } | null)?.name ??
            (studentMaster.program as string),
        };
      }
    }

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
      studentProfile,
      studentEnrollment,
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
          password: u.role === 'STUDENT' ? '' : '06162005',
          role: u.role,
          fullName: u.full_name,
        };
      }),
    };
  }
}
