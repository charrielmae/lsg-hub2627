import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
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
  ReceiptRecord,
  StudentProfileRecord,
  UserRecord,
} from './erd.types';

const CCIS_COLLEGE_ID = '11111111-1111-4111-8111-111111111111';
const OFFICER_USER_ID = '00000000-0000-4000-8000-000000000001';
const STUDENT_USER_ID = '00000000-0000-4000-8000-000000000002';
const STUDENT2_USER_ID = '00000000-0000-4000-8000-000000000003';

const LSG_ORG_ID = '33333333-3333-4333-8333-333333333301';
const CS_ORG_ID = '33333333-3333-4333-8333-333333333302';
const ILSA_ORG_ID = '33333333-3333-4333-8333-333333333303';

@Injectable()
export class DemoStoreService {
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
      full_name: 'Charles Gerald Ayuban',
      role: 'STUDENT',
      college_id: CCIS_COLLEGE_ID,
      is_active: true,
      created_at: '2026-08-18T09:30:00.000Z',
      password_hash: hashPassword('charlesgerald123'),
    },
    {
      id: STUDENT2_USER_ID,
      google_id: null,
      email: 'claire.mendoza@ccislsg.edu.ph',
      username: 'claire.mendoza',
      full_name: 'Claire Mendoza',
      role: 'STUDENT',
      college_id: CCIS_COLLEGE_ID,
      is_active: true,
      created_at: '2026-08-20T10:15:00.000Z',
      password_hash: hashPassword('password123'),
    },
  ];

  readonly studentProfiles: StudentProfileRecord[] = [
    {
      id: '22222222-2222-4222-8222-222222222201',
      user_id: OFFICER_USER_ID,
      student_no: '2023-00101',
      contact_no: '0917-555-0101',
      region_code: '130000000',
      region_name: 'NCR',
      province_code: '133900000',
      province_name: 'Metro Manila',
      city_code: '133900000',
      city_name: 'Manila',
      barangay_code: '133901001',
      barangay_name: 'Sampaloc',
    },
    {
      id: '22222222-2222-4222-8222-222222222202',
      user_id: STUDENT_USER_ID,
      student_no: '2024-00418',
      contact_no: '0918-555-0418',
      region_code: '130000000',
      region_name: 'NCR',
      province_code: '137400000',
      province_name: 'Metro Manila',
      city_code: '137404000',
      city_name: 'Quezon City',
      barangay_code: '137404001',
      barangay_name: 'Diliman',
    },
    {
      id: '22222222-2222-4222-8222-222222222203',
      user_id: STUDENT2_USER_ID,
      student_no: '2025-00892',
      contact_no: '0919-555-0892',
      region_code: '040000000',
      region_name: 'CALABARZON',
      province_code: '042100000',
      province_name: 'Cavite',
      city_code: '042103000',
      city_name: 'Bacoor',
      barangay_code: '042103001',
      barangay_name: 'Molino III',
    },
  ];

  readonly organizations: OrganizationRecord[] = [
    {
      id: LSG_ORG_ID,
      college_id: CCIS_COLLEGE_ID,
      name: 'CCIS Local Student Government (CCISLSG)',
      description:
        'Official college-wide autonomous student government representing all CCIS constituents.',
      logo_url: null,
      type: 'LSG',
      is_active: true,
    },
    {
      id: CS_ORG_ID,
      college_id: CCIS_COLLEGE_ID,
      name: 'CCIS Computing & Guild Society',
      description:
        'Academic organization for software engineering, competitive programming, and systems research.',
      logo_url: null,
      type: 'ORG',
      is_active: true,
    },
    {
      id: ILSA_ORG_ID,
      college_id: CCIS_COLLEGE_ID,
      name: 'Information & Library Science Association',
      description:
        'Co-curricular constituent organization for Information Systems and Library Science majors.',
      logo_url: null,
      type: 'ORG',
      is_active: true,
    },
  ];

  readonly orgOfficers: OrgOfficerRecord[] = [
    {
      id: '44444444-4444-4444-8444-444444444401',
      user_id: OFFICER_USER_ID,
      organization_id: LSG_ORG_ID,
    },
    {
      id: '44444444-4444-4444-8444-444444444402',
      user_id: OFFICER_USER_ID,
      organization_id: CS_ORG_ID,
    },
  ];

  readonly membershipRequirements: MembershipRequirementRecord[] = [
    {
      id: '55555555-5555-4555-8555-555555555501',
      organization_id: LSG_ORG_ID,
      name: 'Validated Certificate of Registration (COR)',
      description: 'PDF or image scan of AY 2026-2027 1st Semester COR.',
    },
    {
      id: '55555555-5555-4555-8555-555555555502',
      organization_id: CS_ORG_ID,
      name: 'Validated COR & Student ID',
      description: 'Proof of enrollment in CCIS for current academic term.',
    },
    {
      id: '55555555-5555-4555-8555-555555555503',
      organization_id: CS_ORG_ID,
      name: 'Signed Data Privacy & Code of Conduct Form',
      description: 'Signed constituent pledge for Guild laboratory events.',
    },
    {
      id: '55555555-5555-4555-8555-555555555504',
      organization_id: ILSA_ORG_ID,
      name: 'Current Semester Registration Form',
      description: 'Official enrollment proof for BSIS / BLIS membership.',
    },
  ];

  readonly memberships: MembershipRecord[] = [
    {
      id: '66666666-6666-4666-8666-666666666601',
      user_id: STUDENT_USER_ID,
      organization_id: LSG_ORG_ID,
      status: 'APPROVED',
      remarks: 'Verified against AY 2026-2027 1st Sem enrollment masterlist.',
      verified_by: OFFICER_USER_ID,
      applied_at: '2026-09-02T08:15:00.000Z',
    },
    {
      id: '66666666-6666-4666-8666-666666666602',
      user_id: STUDENT_USER_ID,
      organization_id: CS_ORG_ID,
      status: 'PENDING',
      remarks: 'Awaiting officer review of uploaded COR.',
      verified_by: null,
      applied_at: '2026-11-20T14:10:00.000Z',
    },
    {
      id: '66666666-6666-4666-8666-666666666603',
      user_id: STUDENT2_USER_ID,
      organization_id: ILSA_ORG_ID,
      status: 'PENDING',
      remarks: 'Submitted registration form for 1st Semester.',
      verified_by: null,
      applied_at: '2026-11-24T11:30:00.000Z',
    },
  ];

  readonly membershipFiles: MembershipFileRecord[] = [
    {
      id: '77777777-7777-4777-8777-777777777701',
      membership_id: '66666666-6666-4666-8666-666666666601',
      requirement_id: '55555555-5555-4555-8555-555555555501',
      file_url: 'https://storage.ccislsg.edu.ph/cor/2024-00418-cor-1s2627.pdf',
      file_key: 'cor/2024-00418-cor-1s2627.pdf',
    },
    {
      id: '77777777-7777-4777-8777-777777777702',
      membership_id: '66666666-6666-4666-8666-666666666602',
      requirement_id: '55555555-5555-4555-8555-555555555502',
      file_url: 'https://storage.ccislsg.edu.ph/guild/2024-00418-id-cor.pdf',
      file_key: 'guild/2024-00418-id-cor.pdf',
    },
  ];

  readonly announcements: AnnouncementRecord[] = [
    {
      id: '88888888-8888-4888-8888-888888888801',
      organization_id: LSG_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: '1st Semester CCIS General Assembly & Digital Clearance Schedule',
      body: 'All CCIS constituents are enjoined to verify their student profile details, settle semesterly council fees through the Hub Finance tab, and check real-time clearance status ahead of Finals Week.',
      created_at: '2026-11-22T09:00:00.000Z',
      updated_at: '2026-11-22T09:00:00.000Z',
    },
    {
      id: '88888888-8888-4888-8888-888888888802',
      organization_id: CS_ORG_ID,
      author_id: OFFICER_USER_ID,
      title: 'CCIS Hackathon & Open-Source Sprint Registration Now Open',
      body: 'Approved Computing & Guild Society members may form 3-to-4 member squads for the upcoming inter-department buildathon. Upload your validated COR in Memberships to complete accreditation.',
      created_at: '2026-11-25T13:30:00.000Z',
      updated_at: '2026-11-25T13:30:00.000Z',
    },
  ];

  readonly feeItems: FeeItemRecord[] = [
    {
      id: '99999999-9999-4999-8999-999999999901',
      organization_id: LSG_ORG_ID,
      name: 'CCISLSG Semesterly Council & Student Welfare Fee',
      amount_centavos: 15000, // PHP 150.00
      semester: '1st Semester',
      school_year: '2026-2027',
      is_active: true,
    },
    {
      id: '99999999-9999-4999-8999-999999999902',
      organization_id: CS_ORG_ID,
      name: 'Computing & Guild Society Annual Membership Fee',
      amount_centavos: 10000, // PHP 100.00
      semester: '1st Semester',
      school_year: '2026-2027',
      is_active: true,
    },
    {
      id: '99999999-9999-4999-8999-999999999903',
      organization_id: LSG_ORG_ID,
      name: 'CCIS Week & College Shirt Solidarity Contribution',
      amount_centavos: 25000, // PHP 250.00
      semester: '1st Semester',
      school_year: '2026-2027',
      is_active: true,
    },
  ];

  readonly payments: PaymentRecord[] = [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
      user_id: STUDENT_USER_ID,
      fee_item_id: '99999999-9999-4999-8999-999999999901',
      amount_centavos: 15000,
      status: 'PAID',
      paymongo_checkout_id: 'cs_ccis_2026_9f81a2c4',
      paymongo_payment_id: 'pay_ccis_2026_7d31b8e0',
      paid_at: '2026-09-05T10:42:00.000Z',
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
      user_id: STUDENT2_USER_ID,
      fee_item_id: '99999999-9999-4999-8999-999999999901',
      amount_centavos: 15000,
      status: 'PENDING',
      paymongo_checkout_id: 'cs_ccis_2026_pending02',
      paymongo_payment_id: null,
      paid_at: null,
    },
  ];

  readonly receipts: ReceiptRecord[] = [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01',
      payment_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
      receipt_no: 'OR-CCIS-2026-000101',
      receipt_url: '/dashboard?tab=finance&receipt=OR-CCIS-2026-000101',
    },
  ];

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

  buildAuthenticatedUser(user: UserRecord): AuthenticatedUser {
    const college =
      this.colleges.find((c) => c.id === user.college_id) || null;
    const studentProfile =
      this.studentProfiles.find((sp) => sp.user_id === user.id) || null;
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
      officerOrganizations,
    };
  }
}
