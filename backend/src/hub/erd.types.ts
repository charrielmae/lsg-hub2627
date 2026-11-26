export type Role =
  | 'STUDENT'
  | 'OFFICER'
  | 'ORG_OFFICER'
  | 'LSG_OFFICER'
  | 'CCISLSG_GOVERNOR'
  | 'ADMIN';

export type OrgType = 'ORG' | 'LSG' | 'COUNCIL';

export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export type ClearanceStatus = 'CLEARED' | 'PENDING' | 'HOLD';

export interface CollegeRecord {
  id: string;
  code: string;
  name: string;
}

export interface UserRecord {
  id: string;
  google_id: string | null;
  email: string;
  full_name: string;
  role: Role;
  college_id: string | null;
  is_active: boolean;
  created_at: string;
  password_hash: string | null;
  username: string | null;
}

export interface StudentProfileRecord {
  id: string;
  user_id: string;
  student_no: string | null;
  contact_no: string | null;
  region_code: string | null;
  region_name: string | null;
  province_code: string | null;
  province_name: string | null;
  city_code: string | null;
  city_name: string | null;
  barangay_code: string | null;
  barangay_name: string | null;
}

export interface OrganizationRecord {
  id: string;
  college_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  type: OrgType;
  is_active: boolean;
}

export interface OrgOfficerRecord {
  id: string;
  user_id: string;
  organization_id: string;
}

export interface MembershipRequirementRecord {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
}

export interface MembershipRecord {
  id: string;
  user_id: string;
  organization_id: string;
  status: MembershipStatus;
  remarks: string | null;
  verified_by: string | null;
  applied_at: string;
}

export interface MembershipFileRecord {
  id: string;
  membership_id: string;
  requirement_id: string;
  file_url: string;
  file_key: string;
}

export interface AnnouncementRecord {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface FeeItemRecord {
  id: string;
  organization_id: string;
  name: string;
  amount_centavos: number;
  semester: string;
  school_year: string;
  is_active: boolean;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  fee_item_id: string;
  amount_centavos: number;
  status: PaymentStatus;
  paymongo_checkout_id: string | null;
  paymongo_payment_id: string | null;
  paid_at: string | null;
}

export interface ReceiptRecord {
  id: string;
  payment_id: string;
  receipt_no: string;
  receipt_url: string | null;
}

export interface ClearanceRecord {
  id: string;
  user_id: string;
  college_id: string;
  semester: string;
  status: ClearanceStatus;
  issued_by: string;
  issued_at: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  googleId: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  college: CollegeRecord | null;
  studentProfile: StudentProfileRecord | null;
  officerOrganizations: Array<{
    id: string;
    name: string;
    type: OrgType;
  }>;
}

export function isStaffRole(role: Role): boolean {
  return role !== 'STUDENT';
}
