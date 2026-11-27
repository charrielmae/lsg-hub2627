export type Role =
  | "STUDENT"
  | "OFFICER"
  | "ORG_OFFICER"
  | "LSG_OFFICER"
  | "CCISLSG_GOVERNOR"
  | "CCISLSG Public Relation Officer"
  | "CCISLSG Committee Staff"
  | "ADMIN";

export type OrgType = "ORG" | "LSG" | "COUNCIL";
export type Program = "BSCS" | "BSIS" | "BSIT";
export type MembershipStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";
export type ClearanceStatus = "CLEARED" | "PENDING" | "HOLD";

export interface CollegeRecord {
  id: string;
  code: string;
  name: string;
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

export interface UserProfile {
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
  studentEnrollment?: {
    program: Program;
    yearLevel: string;
    organizationId: string;
    organizationName: string;
  } | null;
  officerOrganizations: Array<{
    id: string;
    name: string;
    type: OrgType;
  }>;
}

export function isStaffUser(user: UserProfile | null): boolean {
  if (!user) return false;
  return (
    user.role !== "STUDENT" || (user.officerOrganizations?.length ?? 0) > 0
  );
}

export function formatRoleLabel(role: Role): string {
  switch (role) {
    case "CCISLSG_GOVERNOR":
      return "CCISLSG Governor";
    case "CCISLSG Public Relation Officer":
      return "CCISLSG Public Relation Officer";
    case "CCISLSG Committee Staff":
      return "CCISLSG Committee Staff";
    case "LSG_OFFICER":
      return "LSG Officer";
    case "ORG_OFFICER":
      return "Org Officer";
    case "OFFICER":
      return "Officer";
    case "ADMIN":
      return "System Admin";
    case "STUDENT":
      return "Student";
    default:
      return String(role).replace(/_/g, " ");
  }
}

export function formatCentavos(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format((centavos || 0) / 100);
}

export interface LoginResponse {
  accessToken: string;
  mode: "supabase" | "demo";
  user: UserProfile;
}

export interface AuthStatusResponse {
  mode: "supabase" | "demo";
  backendReachable: boolean;
  accounts: Array<{
    email: string;
    username: string | null;
    studentNo: string | null;
    password: string;
    role: Role;
    fullName: string;
  }>;
}

export interface CaptchaChallenge {
  captchaToken: string;
  imageDataUrl: string;
  expiresInSeconds: number;
}

export interface HubOrganization {
  id: string;
  college_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  type: OrgType;
  is_active: boolean;
  college: CollegeRecord | null;
  officers: Array<{
    id: string;
    userId: string;
    fullName: string;
    email: string;
    role: Role;
  }>;
  requirements: Array<{
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
  }>;
  approvedMembersCount: number;
}

export interface HubMembership {
  id: string;
  user_id: string;
  organization_id: string;
  status: MembershipStatus;
  remarks: string | null;
  verified_by: string | null;
  applied_at: string;
  organization: {
    id: string;
    name: string;
    type: OrgType;
  } | null;
  applicant: {
    id: string;
    fullName: string;
    email: string;
    studentNo: string | null;
  } | null;
  verifiedByName: string | null;
  files: Array<{
    id: string;
    membership_id: string;
    requirement_id: string;
    file_url: string;
    file_key: string;
    requirementName: string;
  }>;
}

export interface HubAnnouncement {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  organization: {
    id: string;
    name: string;
    type: OrgType;
  } | null;
  authorName: string;
}

export interface HubFeeItem {
  id: string;
  organization_id: string;
  name: string;
  amount_centavos: number;
  semester: string;
  school_year: string;
  is_active: boolean;
  paidCount?: number;
  organization: {
    id: string;
    name: string;
    type: OrgType;
  } | null;
}

export interface HubPayment {
  id: string;
  user_id: string;
  fee_item_id: string;
  amount_centavos: number;
  status: PaymentStatus;
  paymongo_checkout_id: string | null;
  paymongo_payment_id: string | null;
  paid_at: string | null;
  feeItem: {
    id: string;
    name: string;
    semester: string;
    school_year: string;
    organizationName: string;
  } | null;
  payer: {
    id: string;
    fullName: string;
    email: string;
    studentNo: string | null;
  } | null;
  receipt: {
    id: string;
    payment_id: string;
    receipt_no: string;
    receipt_url: string | null;
  } | null;
}

export interface HubClearance {
  id: string;
  user_id: string;
  college_id: string;
  semester: string;
  status: ClearanceStatus;
  issued_by: string;
  issued_at: string;
  college: CollegeRecord | null;
  student: {
    id: string;
    fullName: string;
    email: string;
    studentNo: string | null;
  } | null;
  issuedByName: string;
}

export interface DirectoryUser {
  id: string;
  fullName: string;
  email: string;
  username: string | null;
  role: Role;
  studentNo: string | null;
}

export interface StudentMasterItem {
  id: string;
  student_no: string;
  full_name: string;
  program: Program;
  year_level: string;
  organization_id: string;
  organizationName: string;
  is_active: boolean;
}

export interface StudentsListResponse {
  counts: {
    total: number;
    BSIT: number;
    BSIS: number;
    BSCS: number;
  };
  items: StudentMasterItem[];
  totalFiltered: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HubSnapshot {
  colleges: CollegeRecord[];
  organizations: HubOrganization[];
  memberships: HubMembership[];
  announcements: HubAnnouncement[];
  feeItems: HubFeeItem[];
  payments: HubPayment[];
  clearances: HubClearance[];
  directoryUsers: DirectoryUser[];
  studentCounts?: {
    total: number;
    BSIT: number;
    BSIS: number;
    BSCS: number;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const TOKEN_KEY = "ccislsg_access_token";
const USER_CACHE_KEY = "ccislsg_user_cache";
const MODE_CACHE_KEY = "ccislsg_auth_mode";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message || "Request failed.";
    throw new Error(msg);
  }

  return payload as T;
}

export async function fetchCaptchaChallenge(): Promise<CaptchaChallenge> {
  const res = await fetch(`${API_BASE_URL}/auth/captcha`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load CAPTCHA challenge");
  }
  return res.json();
}

export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/status`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Status check failed");
    const data = await res.json();
    return {
      mode: data.mode,
      backendReachable: true,
      accounts: data.accounts || [],
    };
  } catch {
    return {
      mode: "demo",
      backendReachable: false,
      accounts: [
        {
          email: "governor@ccislsg.edu.ph",
          username: "ariana.reyes",
          studentNo: "2023-00101",
          password: "password123",
          role: "LSG_OFFICER",
          fullName: "Ariana Reyes",
        },
        {
          email: "student@ccislsg.edu.ph",
          username: "mateo.villanueva",
          studentNo: "2024-00418",
          password: "password123",
          role: "STUDENT",
          fullName: "Mateo Villanueva",
        },
      ],
    };
  }
}

export async function loginRequest(
  identifier: string,
  password: string,
  captchaToken: string,
  captchaAnswer: string
): Promise<LoginResponse> {
  const payload = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      password,
      captchaToken,
      captchaAnswer,
    }),
  });
  saveSession(payload);
  return payload;
}

export async function studentLoginRequest(
  studentNo: string,
  captchaToken: string,
  captchaAnswer: string
): Promise<LoginResponse> {
  const payload = await apiRequest<LoginResponse>("/auth/student-login", {
    method: "POST",
    body: JSON.stringify({
      studentNo,
      captchaToken,
      captchaAnswer,
    }),
  });
  saveSession(payload);
  return payload;
}

export async function fetchCurrentUser(): Promise<{
  user: UserProfile;
  mode: "supabase" | "demo";
} | null> {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const mode =
    (window.localStorage.getItem(MODE_CACHE_KEY) as "supabase" | "demo") ||
    "demo";

  if (!token) return null;

  try {
    const data = await apiRequest<{ user: UserProfile }>("/auth/me");
    window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
    return { user: data.user, mode };
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: LoginResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(session.user));
  window.localStorage.setItem(MODE_CACHE_KEY, session.mode);
}

export function updateCachedUser(user: UserProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_CACHE_KEY);
  window.localStorage.removeItem(MODE_CACHE_KEY);
}

// ============================================================================
// Hub ERD Module API Calls
// ============================================================================

export function fetchHubSnapshot(): Promise<HubSnapshot> {
  return apiRequest<HubSnapshot>("/hub/snapshot");
}

export function fetchStudentsMasterlistApi(params: {
  program?: string;
  year?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<StudentsListResponse> {
  const qs = new URLSearchParams();
  if (params.program) qs.set("program", params.program);
  if (params.year) qs.set("year", params.year);
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  return apiRequest<StudentsListResponse>(`/hub/students?${qs.toString()}`);
}

export function createOrganizationApi(input: {
  collegeId?: string;
  name: string;
  description?: string;
  logoUrl?: string;
  type: OrgType;
}) {
  return apiRequest("/hub/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function assignOfficerApi(organizationId: string, userId: string) {
  return apiRequest(`/hub/organizations/${organizationId}/officers`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function addRequirementApi(
  organizationId: string,
  input: { name: string; description?: string }
) {
  return apiRequest(`/hub/organizations/${organizationId}/requirements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function applyMembershipApi(input: {
  organizationId: string;
  remarks?: string;
  files?: Array<{
    requirementId: string;
    fileUrl: string;
    fileKey: string;
  }>;
}) {
  return apiRequest("/hub/memberships", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateMembershipStatusApi(
  membershipId: string,
  input: { status: MembershipStatus; remarks?: string }
) {
  return apiRequest(`/hub/memberships/${membershipId}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createAnnouncementApi(input: {
  organizationId: string;
  title: string;
  body: string;
}) {
  return apiRequest("/hub/announcements", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteAnnouncementApi(id: string) {
  return apiRequest(`/hub/announcements/${id}`, {
    method: "DELETE",
  });
}

export function createFeeItemApi(input: {
  organizationId: string;
  name: string;
  amountCentavos: number;
  semester: string;
  schoolYear: string;
}) {
  return apiRequest("/hub/fee-items", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteFeeItemApi(id: string) {
  return apiRequest(`/hub/fee-items/${id}`, {
    method: "DELETE",
  });
}

export function checkoutPaymentApi(
  feeItemId: string,
  paymentMethod = "PayMongo"
) {
  return apiRequest("/hub/payments/checkout", {
    method: "POST",
    body: JSON.stringify({ feeItemId, paymentMethod }),
  });
}

export function upsertClearanceApi(input: {
  userId: string;
  collegeId?: string;
  semester: string;
  status: ClearanceStatus;
}) {
  return apiRequest("/hub/clearances", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateStudentProfileApi(input: {
  fullName?: string;
  username?: string;
  studentNo?: string;
  contactNo?: string;
  regionCode?: string;
  regionName?: string;
  provinceCode?: string;
  provinceName?: string;
  cityCode?: string;
  cityName?: string;
  barangayCode?: string;
  barangayName?: string;
}): Promise<UserProfile> {
  const res = await apiRequest<{ user: UserProfile }>("/hub/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  updateCachedUser(res.user);
  return res.user;
}
