import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { hashPassword } from '../auth/password.util';
import {
  AnnouncementRecord,
  AuthenticatedUser,
  ClearanceRecord,
  CollegeRecord,
  FeeItemRecord,
  MembershipFileRecord,
  MembershipRecord,
  MembershipRequirementRecord,
  OrganizationRecord,
  OrgOfficerRecord,
  PaymentRecord,
  Program,
  ReceiptRecord,
  StudentMasterRecord,
  StudentProfileRecord,
  UserRecord,
} from './erd.types';

const CCIS_COLLEGE_ID = '11111111-1111-4111-8111-111111111111';
const OFFICER_USER_ID = '00000000-0000-4000-8000-000000000001';
const STUDENT_USER_ID = '00000000-0000-4000-8000-000000000002';
const STUDENT2_USER_ID = '00000000-0000-4000-8000-000000000003';

export const CCISLSG_ORG_ID = '33333333-3333-4333-8333-333333333300'; // LSG
export const SITS_ORG_ID = '33333333-3333-4333-8333-333333333301'; // BSIT
export const ISS_ORG_ID = '33333333-3333-4333-8333-333333333302';  // BSIS
export const CSS_ORG_ID = '33333333-3333-4333-8333-333333333303';  // BSCS

function loadSeedStudents(): StudentMasterRecord[] {
  const candidates = [
    path.join(process.cwd(), 'src/hub/students.seed.json'),
    path.join(__dirname, 'students.seed.json'),
    path.join(__dirname, '../../src/hub/students.seed.json'),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(
        fs.readFileSync(filePath, 'utf8'),
      ) as StudentMasterRecord[];
    }
  }
  return [];
}

@Injectable()
export class DemoStoreService {
  private readonly persistPath = path.join(
    process.cwd(),
    'data',
    'hub-store.json',
  );

  readonly students: StudentMasterRecord[] = loadSeedStudents();
  private readonly studentsByNo = new Map<string, StudentMasterRecord>(
    this.students.map((s) => [s.student_no.toLowerCase(), s]),
  );

  constructor() {
    this.loadPersistedState();
  }

  readonly colleges: CollegeRecord[] = [
    {
      id: CCIS_COLLEGE_ID,
      code: 'CCIS',
      name: 'College of Computing and Information Sciences',
    },
  ];

  readonly users: UserRecord[] = [
    {
      id: OFFICER_USER_ID,
      google_id: null,
      email: 'charrielmae.ayuban@carsu.edu.ph',
      username: 'charrielmae.ayuban',
      full_name: 'Charriel Mae Ayuban',
      role: 'CCISLSG_GOVERNOR',
      college_id: CCIS_COLLEGE_ID,
      is_active: true,
      created_at: '2026-08-15T08:00:00.000Z',
      password_hash: hashPassword('06162005'),
    },
    {
      id: STUDENT_USER_ID,
      google_id: null,
      email: 'charlesgerald.ayuban@carsu.edu.ph',
      username: 'charlesgerald.ayuban',
      full_name: 'Ayuban, Charles Gerald M.',
      role: 'STUDENT',
      college_id: CCIS_COLLEGE_ID,
      is_active: true,
      created_at: '2026-08-18T09:30:00.000Z',
      password_hash: null,
    },
    {
      id: STUDENT2_USER_ID,
      google_id: null,
      email: '261-02974@carsu.edu.ph',
      username: '261-02974',
      full_name: 'Abuan, Daniela Joy M.',
      role: 'STUDENT',
      college_id: CCIS_COLLEGE_ID,
      is_active: true,
      created_at: '2026-08-20T10:15:00.000Z',
      password_hash: null,
    },
  ];

  readonly studentProfiles: StudentProfileRecord[] = [
    {
      id: '22222222-2222-4222-8222-222222222201',
      user_id: OFFICER_USER_ID,
      student_no: '241-03025',
      contact_no: '0917-555-0101',
      region_code: '160000000',
      region_name: 'Caraga Region (Region XIII)',
      province_code: '160200000',
      province_name: 'Agusan del Norte',
      city_code: '8600',
      city_name: 'Butuan City',
      barangay_code: '160202003',
      barangay_name: 'Ampayon',
    },
    {
      id: '22222222-2222-4222-8222-222222222202',
      user_id: STUDENT_USER_ID,
      student_no: '261-01458',
      contact_no: '0918-555-0418',
      region_code: '160000000',
      region_name: 'Caraga Region (Region XIII)',
      province_code: '160200000',
      province_name: 'Agusan del Norte',
      city_code: '8600',
      city_name: 'Butuan City',
      barangay_code: '160202003',
      barangay_name: 'Ampayon',
    },
    {
      id: '22222222-2222-4222-8222-222222222203',
      user_id: STUDENT2_USER_ID,
      student_no: '261-02974',
      contact_no: '0919-555-0892',
      region_code: '160000000',
      region_name: 'Caraga Region (Region XIII)',
      province_code: '160200000',
      province_name: 'Agusan del Norte',
      city_code: '8600',
      city_name: 'Butuan City',
      barangay_code: '160202003',
      barangay_name: 'Ampayon',
    },
  ];

  readonly organizations: OrganizationRecord[] = [
    {
      id: CCISLSG_ORG_ID,
      college_id: CCIS_COLLEGE_ID,
      name: 'Local Student Government',
      description:
        'Official College of Computing and Information Sciences Local Student Government (CCISLSG) representing all BSIT, BSIS, and BSCS constituents.',
      logo_url: '/ccislsg-logo.png',
      type: 'LSG',
      is_active: true,
    },
    {
      id: SITS_ORG_ID,
      college_id: CCIS_COLLEGE_ID,
      name: 'Society of Information Technology Students',
      description:
        'Official academic student organization for Bachelor of Science in Information Technology (BSIT) students in CCIS.',
      logo_url: null,
      type: 'ORG',
      is_active: true,
    },
    {
      id: ISS_ORG_ID,
      college_id: CCIS_COLLEGE_ID,
      name: 'Information System Students',
      description:
        'Official academic student organization for Bachelor of Science in Information Systems (BSIS) students in CCIS.',
      logo_url: null,
      type: 'ORG',
      is_active: true,
    },
    {
      id: CSS_ORG_ID,
      college_id: CCIS_COLLEGE_ID,
      name: 'Computer Science Students',
      description:
        'Official academic student organization for Bachelor of Science in Computer Science (BSCS) students in CCIS.',
      logo_url: null,
      type: 'ORG',
      is_active: true,
    },
  ];

  readonly orgOfficers: OrgOfficerRecord[] = [
    {
      id: '44444444-4444-4444-8444-444444444400',
      user_id: OFFICER_USER_ID,
      organization_id: CCISLSG_ORG_ID,
    },
    {
      id: '44444444-4444-4444-8444-444444444401',
      user_id: OFFICER_USER_ID,
      organization_id: SITS_ORG_ID,
    },
  ];

  readonly membershipRequirements: MembershipRequirementRecord[] = [
    {
      id: '55555555-5555-4555-8555-555555555501',
      organization_id: SITS_ORG_ID,
      name: 'Validated Certificate of Registration (COR)',
      description: 'PDF or image scan of AY 2026-2027 1st Semester COR.',
    },
    {
      id: '55555555-5555-4555-8555-555555555502',
      organization_id: ISS_ORG_ID,
      name: 'Validated COR & Student ID',
      description: 'Proof of enrollment in CCIS for current academic term.',
    },
    {
      id: '55555555-5555-4555-8555-555555555503',
      organization_id: ISS_ORG_ID,
      name: 'Signed Data Privacy & Code of Conduct Form',
      description: 'Signed constituent pledge for organization activities.',
    },
    {
      id: '55555555-5555-4555-8555-555555555504',
      organization_id: CSS_ORG_ID,
      name: 'Current Semester Registration Form',
      description: 'Official enrollment proof for BSCS membership.',
    },
  ];

  readonly memberships: MembershipRecord[] = [
    {
      id: '66666666-6666-4666-8666-666666666601',
      user_id: STUDENT_USER_ID,
      organization_id: SITS_ORG_ID,
      status: 'APPROVED',
      remarks: 'Verified against AY 2026-2027 BSIT orientation masterlist.',
      verified_by: OFFICER_USER_ID,
      applied_at: '2026-09-02T08:15:00.000Z',
    },
    {
      id: '66666666-6666-4666-8666-666666666603',
      user_id: STUDENT2_USER_ID,
      organization_id: CSS_ORG_ID,
      status: 'PENDING',
      remarks: 'Submitted registration form for 1st Semester BSCS.',
      verified_by: null,
      applied_at: '2026-11-24T11:30:00.000Z',
    },
  ];

  readonly membershipFiles: MembershipFileRecord[] = [
    {
      id: '77777777-7777-4777-8777-777777777701',
      membership_id: '66666666-6666-4666-8666-666666666601',
      requirement_id: '55555555-5555-4555-8555-555555555501',
      file_url: 'https://storage.ccislsg.edu.ph/cor/261-01458-cor-1s2627.pdf',
      file_key: 'cor/261-01458-cor-1s2627.pdf',
    },
  ];

  readonly announcements: AnnouncementRecord[] = [
    {
      id: '88888888-8888-4888-8888-888888888801',
      organization_id: CCISLSG_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'Sangka 2026: CCIS Clinches Overall 4th Runner-Up!',
      body: 'Congratulations, CCISians! Through the dedication of our athletes, cultural performers, esports contenders, working committees, and cheering constituents, the College of Computing and Information Sciences proudly finished as Overall 4th Runner-Up in Sangka 2026. Padayon, CCIS!',
      created_at: '2026-11-27T10:00:00.000Z',
      updated_at: '2026-11-27T10:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888802',
      organization_id: CCISLSG_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'Official Directive: No Blocking of Clearance for Sangka 2026',
      body: 'Please be informed that the CCIS Local Student Government strictly enforces a No Blocking of Clearance policy in relation to Sangka 2026 attendance, fines, or event participation. No constituent clearance shall be held or delayed due to Sangka 2026 activities.',
      created_at: '2026-11-27T09:30:00.000Z',
      updated_at: '2026-11-27T09:30:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888803',
      organization_id: SITS_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'Tuklas.exe — SITES Tech Discovery & Freshmen Onboarding',
      body: 'Welcome to Tuklas.exe! The Society of Information Technology Students (SITES) invites all BSIT students to join our flagship tech orientation, skills discovery showcase, and student community kickoff.',
      created_at: '2026-11-26T15:00:00.000Z',
      updated_at: '2026-11-26T15:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888804',
      organization_id: SITS_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'SITES 1st General Assembly — AY 2026–2027',
      body: 'All BSIT constituents under the Society of Information Technology Students are enjoined to attend the 1st General Assembly for the presentation of officers, semesterly calendar of activities, financial transparency report, and open forum.',
      created_at: '2026-11-26T13:00:00.000Z',
      updated_at: '2026-11-26T13:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888805',
      organization_id: SITS_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'SITES Peer-to-Peer Tutorial Program',
      body: 'Need review support for upcoming assessments? SITES Peer-to-Peer Tutorial sessions are now open for BSIT students covering programming fundamentals, web technologies, networking, and database coursework.',
      created_at: '2026-11-26T10:00:00.000Z',
      updated_at: '2026-11-26T10:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888806',
      organization_id: ISS_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'Tuklas.exe — ISS Systems & Innovation Orientation',
      body: 'Information System Students (ISS) welcomes all BSIS constituents to Tuklas.exe—featuring systems analysis tracks, student organization orientation, and collaborative tech activities across CCIS.',
      created_at: '2026-11-25T15:00:00.000Z',
      updated_at: '2026-11-25T15:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888807',
      organization_id: ISS_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'ISS Peer-to-Peer Tutorial Sessions',
      body: 'Information System Students (ISS) is launching Peer-to-Peer Tutorial study groups to assist BSIS students in enterprise architecture, database management, business process modeling, and core programming subjects.',
      created_at: '2026-11-25T11:00:00.000Z',
      updated_at: '2026-11-25T11:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888808',
      organization_id: CSS_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'Tuklas.exe — CSS Computing & Research Showcase',
      body: 'Computer Science Students (CSS) invites all BSCS students to participate in Tuklas.exe for an introduction to CS specializations, algorithmic problem-solving, and student community initiatives.',
      created_at: '2026-11-24T15:00:00.000Z',
      updated_at: '2026-11-24T15:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888809',
      organization_id: CSS_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'CSS Peer-to-Peer Tutorial Sessions',
      body: 'Join the Computer Science Students (CSS) Peer-to-Peer Tutorial sessions! Senior BSCS mentors will facilitate guided reviews on data structures, algorithms, discrete structures, and object-oriented programming.',
      created_at: '2026-11-24T10:30:00.000Z',
      updated_at: '2026-11-24T10:30:00.000Z',
    },
  ];

  readonly feeItems: FeeItemRecord[] = [];

  readonly payments: PaymentRecord[] = [];

  readonly receipts: ReceiptRecord[] = [];

  readonly clearances: ClearanceRecord[] = [
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc01',
      user_id: OFFICER_USER_ID,
      college_id: CCIS_COLLEGE_ID,
      semester: '1st Semester AY 2026-2027',
      status: 'CLEARED',
      issued_by: OFFICER_USER_ID,
      issued_at: '2026-11-15T08:00:00.000Z',
    },
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc02',
      user_id: STUDENT_USER_ID,
      college_id: CCIS_COLLEGE_ID,
      semester: '1st Semester AY 2026-2027',
      status: 'PENDING',
      issued_by: OFFICER_USER_ID,
      issued_at: '2026-11-20T09:00:00.000Z',
    },
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccc03',
      user_id: STUDENT2_USER_ID,
      college_id: CCIS_COLLEGE_ID,
      semester: '1st Semester AY 2026-2027',
      status: 'HOLD',
      issued_by: OFFICER_USER_ID,
      issued_at: '2026-11-24T15:00:00.000Z',
    },
  ];

  nextId(): string {
    return randomUUID();
  }

  private loadPersistedState(): void {
    try {
      if (!fs.existsSync(this.persistPath)) return;
      const raw = JSON.parse(fs.readFileSync(this.persistPath, 'utf8'));
      if (Array.isArray(raw.organizations) && raw.organizations.length > 0) {
        this.organizations.splice(
          0,
          this.organizations.length,
          ...raw.organizations,
        );
      }
      if (Array.isArray(raw.orgOfficers) && raw.orgOfficers.length > 0) {
        this.orgOfficers.splice(
          0,
          this.orgOfficers.length,
          ...raw.orgOfficers,
        );
      }
      if (
        Array.isArray(raw.membershipRequirements) &&
        raw.membershipRequirements.length > 0
      ) {
        this.membershipRequirements.splice(
          0,
          this.membershipRequirements.length,
          ...raw.membershipRequirements,
        );
      }
      if (Array.isArray(raw.feeItems)) {
        this.feeItems.splice(0, this.feeItems.length, ...raw.feeItems);
      }
      if (Array.isArray(raw.payments)) {
        this.payments.splice(0, this.payments.length, ...raw.payments);
      }
      if (Array.isArray(raw.receipts)) {
        this.receipts.splice(0, this.receipts.length, ...raw.receipts);
      }
      if (Array.isArray(raw.announcements) && raw.announcements.length > 0) {
        this.announcements.splice(
          0,
          this.announcements.length,
          ...raw.announcements,
        );
      }
      if (Array.isArray(raw.memberships) && raw.memberships.length > 0) {
        this.memberships.splice(0, this.memberships.length, ...raw.memberships);
      }
      if (Array.isArray(raw.membershipFiles)) {
        this.membershipFiles.splice(
          0,
          this.membershipFiles.length,
          ...raw.membershipFiles,
        );
      }
      if (Array.isArray(raw.clearances) && raw.clearances.length > 0) {
        this.clearances.splice(0, this.clearances.length, ...raw.clearances);
      }
      if (Array.isArray(raw.users) && raw.users.length > 0) {
        for (const savedUser of raw.users as UserRecord[]) {
          if (!this.users.some((u) => u.id === savedUser.id)) {
            this.users.push(savedUser);
          }
        }
      }
      if (Array.isArray(raw.studentProfiles)) {
        for (const sp of raw.studentProfiles as StudentProfileRecord[]) {
          if (!this.studentProfiles.some((p) => p.user_id === sp.user_id)) {
            this.studentProfiles.push(sp);
          }
        }
      }
    } catch {
      // Ignore corrupted local cache and keep clean defaults
    }
  }

  persist(): void {
    try {
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.persistPath,
        JSON.stringify(
          {
            users: this.users,
            studentProfiles: this.studentProfiles,
            organizations: this.organizations,
            orgOfficers: this.orgOfficers,
            membershipRequirements: this.membershipRequirements,
            feeItems: this.feeItems,
            payments: this.payments,
            receipts: this.receipts,
            announcements: this.announcements,
            memberships: this.memberships,
            membershipFiles: this.membershipFiles,
            clearances: this.clearances,
          },
          null,
          2,
        ),
        'utf8',
      );
    } catch {
      // Non-fatal in read-only environments
    }
  }

  findStudentMasterByNo(studentNo: string): StudentMasterRecord | null {
    return this.studentsByNo.get(studentNo.trim().toLowerCase()) ?? null;
  }

  ensureUserForStudent(studentNo: string): UserRecord | null {
    const normalized = studentNo.trim().toLowerCase();

    // Check existing studentProfiles first
    const existingProfile = this.studentProfiles.find(
      (sp) => sp.student_no?.toLowerCase() === normalized,
    );
    if (existingProfile) {
      const existingUser = this.users.find(
        (u) => u.id === existingProfile.user_id,
      );
      if (existingUser) return existingUser;
    }

    // Otherwise check the 1,817-student orientation roster
    const master = this.studentsByNo.get(normalized);
    if (!master) return null;

    const newUserId = master.id;
    let user = this.users.find((u) => u.id === newUserId);
    if (!user) {
      user = {
        id: newUserId,
        google_id: null,
        email: `${master.student_no.toLowerCase()}@carsu.edu.ph`,
        username: master.student_no,
        full_name: master.full_name,
        role: 'STUDENT',
        college_id: CCIS_COLLEGE_ID,
        is_active: master.is_active,
        created_at: new Date().toISOString(),
        password_hash: null,
      };
      this.users.push(user);
    }

    if (!this.studentProfiles.some((sp) => sp.user_id === user!.id)) {
      this.studentProfiles.push({
        id: this.nextId(),
        user_id: user.id,
        student_no: master.student_no,
        contact_no: null,
        region_code: '160000000',
        region_name: 'Caraga Region (Region XIII)',
        province_code: '160200000',
        province_name: 'Agusan del Norte',
        city_code: '8600',
        city_name: 'Butuan City',
        barangay_code: '160202003',
        barangay_name: 'Ampayon',
      });
    }

    // Designate student into their program organization automatically
    if (
      !this.memberships.some(
        (m) =>
          m.user_id === user!.id &&
          m.organization_id === master.organization_id,
      )
    ) {
      this.memberships.push({
        id: this.nextId(),
        user_id: user.id,
        organization_id: master.organization_id,
        status: 'APPROVED',
        remarks: `Designated via ${master.program} (${master.year_level} Year) orientation masterlist.`,
        verified_by: OFFICER_USER_ID,
        applied_at: new Date().toISOString(),
      });
    }

    this.persist();
    return user;
  }

  getProgramCounts(): Record<Program | 'total', number> {
    const counts: Record<Program | 'total', number> = {
      total: this.students.length,
      BSIT: 0,
      BSIS: 0,
      BSCS: 0,
    };
    for (const s of this.students) {
      if (s.program in counts) {
        counts[s.program] += 1;
      }
    }
    return counts;
  }

  buildAuthenticatedUser(user: UserRecord): AuthenticatedUser {
    const college =
      this.colleges.find((c) => c.id === user.college_id) || null;
    const studentProfile =
      this.studentProfiles.find((sp) => sp.user_id === user.id) || null;

    const master = studentProfile?.student_no
      ? this.findStudentMasterByNo(studentProfile.student_no)
      : null;
    const designatedOrg = master
      ? this.organizations.find((o) => o.id === master.organization_id)
      : null;

    const officerOrgIds = this.orgOfficers
      .filter((oo) => oo.user_id === user.id)
      .map((oo) => oo.organization_id);
    const officerOrganizations = this.organizations
      .filter((org) => officerOrgIds.includes(org.id))
      .map((org) => ({
        id: org.id,
        name: org.name,
        type: org.type,
      }));

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      googleId: user.google_id,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      college,
      studentProfile,
      studentEnrollment: master
        ? {
            program: master.program,
            yearLevel: master.year_level,
            organizationId: master.organization_id,
            organizationName: designatedOrg?.name ?? master.program,
          }
        : null,
      officerOrganizations,
    };
  }
}
