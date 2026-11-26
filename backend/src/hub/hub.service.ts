import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { SupabaseService } from '../supabase/supabase.service';
import { DemoStoreService } from './demo-store.service';
import {
  ApplyMembershipDto,
  AssignOfficerDto,
  CheckoutPaymentDto,
  CreateAnnouncementDto,
  CreateFeeItemDto,
  CreateOrganizationDto,
  CreateRequirementDto,
  UpdateMembershipStatusDto,
  UpdateStudentProfileDto,
  UpsertClearanceDto,
} from './dto/hub.dto';
import {
  AnnouncementRecord,
  AuthenticatedUser,
  ClearanceRecord,
  CollegeRecord,
  FeeItemRecord,
  isStaffRole,
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

@Injectable()
export class HubService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly demoStore: DemoStoreService,
    private readonly authService: AuthService,
  ) {}

  private assertStaff(user: AuthenticatedUser): void {
    if (!isStaffRole(user.role) && user.officerOrganizations.length === 0) {
      throw new ForbiddenException(
        'Only LSG/Organization Officers or Admins can perform this action.',
      );
    }
  }

  async getSnapshot(user: AuthenticatedUser) {
    if (this.supabaseService.isConfigured()) {
      return this.getSupabaseSnapshot(user);
    }
    return this.getDemoSnapshot(user);
  }

  private getDemoSnapshot(user: AuthenticatedUser) {
    const isStaff =
      isStaffRole(user.role) || user.officerOrganizations.length > 0;

    const usersMap = new Map(this.demoStore.users.map((u) => [u.id, u]));
    const profilesByUser = new Map(
      this.demoStore.studentProfiles.map((sp) => [sp.user_id, sp]),
    );
    const collegesMap = new Map(this.demoStore.colleges.map((c) => [c.id, c]));
    const orgsMap = new Map(this.demoStore.organizations.map((o) => [o.id, o]));
    const reqsMap = new Map(
      this.demoStore.membershipRequirements.map((r) => [r.id, r]),
    );
    const receiptsByPayment = new Map(
      this.demoStore.receipts.map((r) => [r.payment_id, r]),
    );

    const organizations = this.demoStore.organizations.map((org) => {
      const officers = this.demoStore.orgOfficers
        .filter((oo) => oo.organization_id === org.id)
        .map((oo) => {
          const u = usersMap.get(oo.user_id);
          return {
            id: oo.id,
            userId: oo.user_id,
            fullName: u?.full_name ?? 'Unknown User',
            email: u?.email ?? '',
            role: u?.role ?? 'OFFICER',
          };
        });

      const requirements = this.demoStore.membershipRequirements.filter(
        (r) => r.organization_id === org.id,
      );

      const approvedMembersCount = this.demoStore.memberships.filter(
        (m) => m.organization_id === org.id && m.status === 'APPROVED',
      ).length;

      return {
        ...org,
        college: collegesMap.get(org.college_id) ?? null,
        officers,
        requirements,
        approvedMembersCount,
      };
    });

    const visibleMemberships = isStaff
      ? this.demoStore.memberships
      : this.demoStore.memberships.filter((m) => m.user_id === user.id);

    const memberships = [...visibleMemberships]
      .sort((a, b) => b.applied_at.localeCompare(a.applied_at))
      .map((m) => {
        const applicant = usersMap.get(m.user_id);
        const applicantProfile = profilesByUser.get(m.user_id);
        const verifier = m.verified_by ? usersMap.get(m.verified_by) : null;
        const files = this.demoStore.membershipFiles
          .filter((f) => f.membership_id === m.id)
          .map((f) => ({
            ...f,
            requirementName: reqsMap.get(f.requirement_id)?.name ?? 'Document',
          }));

        return {
          ...m,
          organization: orgsMap.get(m.organization_id) ?? null,
          applicant: applicant
            ? {
                id: applicant.id,
                fullName: applicant.full_name,
                email: applicant.email,
                studentNo: applicantProfile?.student_no ?? null,
              }
            : null,
          verifiedByName: verifier?.full_name ?? null,
          files,
        };
      });

    const announcements = [...this.demoStore.announcements]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((a) => ({
        ...a,
        organization: orgsMap.get(a.organization_id) ?? null,
        authorName: usersMap.get(a.author_id)?.full_name ?? 'Council Officer',
      }));

    const feeItems = this.demoStore.feeItems.map((f) => ({
      ...f,
      organization: orgsMap.get(f.organization_id) ?? null,
    }));

    const visiblePayments = isStaff
      ? this.demoStore.payments
      : this.demoStore.payments.filter((p) => p.user_id === user.id);

    const feeMap = new Map(this.demoStore.feeItems.map((f) => [f.id, f]));
    const payments = [...visiblePayments]
      .sort((a, b) => (b.paid_at ?? '').localeCompare(a.paid_at ?? ''))
      .map((p) => {
        const payer = usersMap.get(p.user_id);
        const payerProfile = profilesByUser.get(p.user_id);
        const feeItem = feeMap.get(p.fee_item_id) ?? null;
        return {
          ...p,
          feeItem: feeItem
            ? {
                ...feeItem,
                organizationName:
                  orgsMap.get(feeItem.organization_id)?.name ?? 'CCISLSG',
              }
            : null,
          payer: payer
            ? {
                id: payer.id,
                fullName: payer.full_name,
                email: payer.email,
                studentNo: payerProfile?.student_no ?? null,
              }
            : null,
          receipt: receiptsByPayment.get(p.id) ?? null,
        };
      });

    const visibleClearances = isStaff
      ? this.demoStore.clearances
      : this.demoStore.clearances.filter((c) => c.user_id === user.id);

    const clearances = [...visibleClearances]
      .sort((a, b) => b.issued_at.localeCompare(a.issued_at))
      .map((c) => {
        const student = usersMap.get(c.user_id);
        const studentProfile = profilesByUser.get(c.user_id);
        const issuer = usersMap.get(c.issued_by);
        return {
          ...c,
          college: collegesMap.get(c.college_id) ?? null,
          student: student
            ? {
                id: student.id,
                fullName: student.full_name,
                email: student.email,
                studentNo: studentProfile?.student_no ?? null,
              }
            : null,
          issuedByName: issuer?.full_name ?? 'Council Officer',
        };
      });

    const directoryUsers = isStaff
      ? this.demoStore.users.map((u) => ({
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          username: u.username,
          role: u.role,
          studentNo: profilesByUser.get(u.id)?.student_no ?? null,
        }))
      : [];

    return {
      colleges: this.demoStore.colleges,
      organizations,
      memberships,
      announcements,
      feeItems,
      payments,
      clearances,
      directoryUsers,
    };
  }

  private async getSupabaseSnapshot(user: AuthenticatedUser) {
    const admin = this.supabaseService.getAdminClient();
    const isStaff =
      isStaffRole(user.role) || user.officerOrganizations.length > 0;

    const [
      collegesRes,
      usersRes,
      profilesRes,
      orgsRes,
      officersRes,
      reqsRes,
      membershipsRes,
      filesRes,
      announcementsRes,
      feeItemsRes,
      paymentsRes,
      receiptsRes,
      clearancesRes,
    ] = await Promise.all([
      admin.from('colleges').select('*'),
      admin.from('users').select('id, google_id, email, full_name, role, college_id, is_active, created_at, username'),
      admin.from('student_profiles').select('*'),
      admin.from('organizations').select('*'),
      admin.from('org_officers').select('*'),
      admin.from('membership_requirements').select('*'),
      isStaff
        ? admin.from('memberships').select('*')
        : admin.from('memberships').select('*').eq('user_id', user.id),
      admin.from('membership_files').select('*'),
      admin.from('announcements').select('*').order('created_at', { ascending: false }),
      admin.from('fee_items').select('*'),
      isStaff
        ? admin.from('payments').select('*')
        : admin.from('payments').select('*').eq('user_id', user.id),
      admin.from('receipts').select('*'),
      isStaff
        ? admin.from('clearances').select('*')
        : admin.from('clearances').select('*').eq('user_id', user.id),
    ]);

    const colleges = (collegesRes.data || []) as CollegeRecord[];
    const users = (usersRes.data || []) as UserRecord[];
    const studentProfiles = (profilesRes.data || []) as StudentProfileRecord[];
    const orgs = (orgsRes.data || []) as OrganizationRecord[];
    const orgOfficers = (officersRes.data || []) as OrgOfficerRecord[];
    const reqs = (reqsRes.data || []) as MembershipRequirementRecord[];
    const rawMemberships = (membershipsRes.data || []) as MembershipRecord[];
    const rawFiles = (filesRes.data || []) as MembershipFileRecord[];
    const rawAnnouncements = (announcementsRes.data || []) as AnnouncementRecord[];
    const rawFeeItems = (feeItemsRes.data || []) as FeeItemRecord[];
    const rawPayments = (paymentsRes.data || []) as PaymentRecord[];
    const rawReceipts = (receiptsRes.data || []) as ReceiptRecord[];
    const rawClearances = (clearancesRes.data || []) as ClearanceRecord[];

    const usersMap = new Map(users.map((u) => [u.id, u]));
    const profilesByUser = new Map(studentProfiles.map((sp) => [sp.user_id, sp]));
    const collegesMap = new Map(colleges.map((c) => [c.id, c]));
    const orgsMap = new Map(orgs.map((o) => [o.id, o]));
    const reqsMap = new Map(reqs.map((r) => [r.id, r]));
    const feeMap = new Map(rawFeeItems.map((f) => [f.id, f]));
    const receiptsByPayment = new Map(rawReceipts.map((r) => [r.payment_id, r]));

    const organizations = orgs.map((org) => ({
      ...org,
      college: collegesMap.get(org.college_id) ?? null,
      officers: orgOfficers
        .filter((oo) => oo.organization_id === org.id)
        .map((oo) => {
          const u = usersMap.get(oo.user_id);
          return {
            id: oo.id,
            userId: oo.user_id,
            fullName: u?.full_name ?? 'Unknown User',
            email: u?.email ?? '',
            role: u?.role ?? 'OFFICER',
          };
        }),
      requirements: reqs.filter((r) => r.organization_id === org.id),
      approvedMembersCount: rawMemberships.filter(
        (m) => m.organization_id === org.id && m.status === 'APPROVED',
      ).length,
    }));

    const memberships = rawMemberships
      .sort((a, b) => b.applied_at.localeCompare(a.applied_at))
      .map((m) => {
        const applicant = usersMap.get(m.user_id);
        const applicantProfile = profilesByUser.get(m.user_id);
        const verifier = m.verified_by ? usersMap.get(m.verified_by) : null;
        const files = rawFiles
          .filter((f) => f.membership_id === m.id)
          .map((f) => ({
            ...f,
            requirementName: reqsMap.get(f.requirement_id)?.name ?? 'Document',
          }));

        return {
          ...m,
          organization: orgsMap.get(m.organization_id) ?? null,
          applicant: applicant
            ? {
                id: applicant.id,
                fullName: applicant.full_name,
                email: applicant.email,
                studentNo: applicantProfile?.student_no ?? null,
              }
            : null,
          verifiedByName: verifier?.full_name ?? null,
          files,
        };
      });

    const announcements = rawAnnouncements.map((a) => ({
      ...a,
      organization: orgsMap.get(a.organization_id) ?? null,
      authorName: usersMap.get(a.author_id)?.full_name ?? 'Council Officer',
    }));

    const feeItems = rawFeeItems.map((f) => ({
      ...f,
      organization: orgsMap.get(f.organization_id) ?? null,
    }));

    const payments = rawPayments.map((p) => {
      const payer = usersMap.get(p.user_id);
      const payerProfile = profilesByUser.get(p.user_id);
      const feeItem = feeMap.get(p.fee_item_id) ?? null;
      return {
        ...p,
        feeItem: feeItem
          ? {
              ...feeItem,
              organizationName:
                orgsMap.get(feeItem.organization_id)?.name ?? 'CCISLSG',
            }
          : null,
        payer: payer
          ? {
              id: payer.id,
              fullName: payer.full_name,
              email: payer.email,
              studentNo: payerProfile?.student_no ?? null,
            }
          : null,
        receipt: receiptsByPayment.get(p.id) ?? null,
      };
    });

    const clearances = rawClearances.map((c) => {
      const student = usersMap.get(c.user_id);
      const studentProfile = profilesByUser.get(c.user_id);
      const issuer = usersMap.get(c.issued_by);
      return {
        ...c,
        college: collegesMap.get(c.college_id) ?? null,
        student: student
          ? {
              id: student.id,
              fullName: student.full_name,
              email: student.email,
              studentNo: studentProfile?.student_no ?? null,
            }
          : null,
        issuedByName: issuer?.full_name ?? 'Council Officer',
      };
    });

    const directoryUsers = isStaff
      ? users.map((u) => ({
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          username: u.username,
          role: u.role,
          studentNo: profilesByUser.get(u.id)?.student_no ?? null,
        }))
      : [];

    return {
      colleges,
      organizations,
      memberships,
      announcements,
      feeItems,
      payments,
      clearances,
      directoryUsers,
    };
  }

  async createOrganization(
    user: AuthenticatedUser,
    dto: CreateOrganizationDto,
  ) {
    this.assertStaff(user);
    const collegeId =
      dto.collegeId ||
      user.college?.id ||
      this.demoStore.colleges[0]?.id;

    if (!collegeId) {
      throw new BadRequestException('A valid college_id is required.');
    }

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data, error } = await admin
        .from('organizations')
        .insert({
          college_id: collegeId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          logo_url: dto.logoUrl?.trim() || null,
          type: dto.type,
          is_active: true,
        })
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const record: OrganizationRecord = {
      id: this.demoStore.nextId(),
      college_id: collegeId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      logo_url: dto.logoUrl?.trim() || null,
      type: dto.type,
      is_active: true,
    };
    this.demoStore.organizations.push(record);
    return record;
  }

  async assignOfficer(
    user: AuthenticatedUser,
    organizationId: string,
    dto: AssignOfficerDto,
  ) {
    this.assertStaff(user);

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data, error } = await admin
        .from('org_officers')
        .insert({
          user_id: dto.userId,
          organization_id: organizationId,
        })
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const exists = this.demoStore.orgOfficers.some(
      (oo) =>
        oo.organization_id === organizationId && oo.user_id === dto.userId,
    );
    if (exists) {
      throw new BadRequestException(
        'User is already assigned as an officer of this organization.',
      );
    }

    const record: OrgOfficerRecord = {
      id: this.demoStore.nextId(),
      user_id: dto.userId,
      organization_id: organizationId,
    };
    this.demoStore.orgOfficers.push(record);
    return record;
  }

  async addRequirement(
    user: AuthenticatedUser,
    organizationId: string,
    dto: CreateRequirementDto,
  ) {
    this.assertStaff(user);

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data, error } = await admin
        .from('membership_requirements')
        .insert({
          organization_id: organizationId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
        })
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const record: MembershipRequirementRecord = {
      id: this.demoStore.nextId(),
      organization_id: organizationId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
    };
    this.demoStore.membershipRequirements.push(record);
    return record;
  }

  async applyMembership(user: AuthenticatedUser, dto: ApplyMembershipDto) {
    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data: existing } = await admin
        .from('memberships')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('organization_id', dto.organizationId)
        .in('status', ['PENDING', 'APPROVED'])
        .maybeSingle();

      if (existing) {
        throw new BadRequestException(
          `You already have a ${existing.status.toLowerCase()} membership for this organization.`,
        );
      }

      const { data: created, error } = await admin
        .from('memberships')
        .insert({
          user_id: user.id,
          organization_id: dto.organizationId,
          status: 'PENDING',
          remarks: dto.remarks?.trim() || null,
        })
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);

      if (dto.files?.length) {
        await admin.from('membership_files').insert(
          dto.files.map((f) => ({
            membership_id: created.id,
            requirement_id: f.requirementId,
            file_url: f.fileUrl.trim(),
            file_key: f.fileKey.trim(),
          })),
        );
      }

      return created;
    }

    const existing = this.demoStore.memberships.find(
      (m) =>
        m.user_id === user.id &&
        m.organization_id === dto.organizationId &&
        (m.status === 'PENDING' || m.status === 'APPROVED'),
    );
    if (existing) {
      throw new BadRequestException(
        `You already have a ${existing.status.toLowerCase()} membership for this organization.`,
      );
    }

    const membership: MembershipRecord = {
      id: this.demoStore.nextId(),
      user_id: user.id,
      organization_id: dto.organizationId,
      status: 'PENDING',
      remarks: dto.remarks?.trim() || null,
      verified_by: null,
      applied_at: new Date().toISOString(),
    };
    this.demoStore.memberships.unshift(membership);

    if (dto.files?.length) {
      for (const f of dto.files) {
        this.demoStore.membershipFiles.push({
          id: this.demoStore.nextId(),
          membership_id: membership.id,
          requirement_id: f.requirementId,
          file_url: f.fileUrl.trim(),
          file_key: f.fileKey.trim(),
        });
      }
    }

    return membership;
  }

  async updateMembershipStatus(
    user: AuthenticatedUser,
    membershipId: string,
    dto: UpdateMembershipStatusDto,
  ) {
    this.assertStaff(user);

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data, error } = await admin
        .from('memberships')
        .update({
          status: dto.status,
          remarks: dto.remarks?.trim() || null,
          verified_by: user.id,
        })
        .eq('id', membershipId)
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const target = this.demoStore.memberships.find(
      (m) => m.id === membershipId,
    );
    if (!target) {
      throw new NotFoundException('Membership application not found.');
    }

    target.status = dto.status;
    target.remarks = dto.remarks?.trim() || target.remarks;
    target.verified_by = user.id;
    return target;
  }

  async createAnnouncement(
    user: AuthenticatedUser,
    dto: CreateAnnouncementDto,
  ) {
    this.assertStaff(user);
    const now = new Date().toISOString();

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data, error } = await admin
        .from('announcements')
        .insert({
          organization_id: dto.organizationId,
          author_id: user.id,
          title: dto.title.trim(),
          body: dto.body.trim(),
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const announcement: AnnouncementRecord = {
      id: this.demoStore.nextId(),
      organization_id: dto.organizationId,
      author_id: user.id,
      title: dto.title.trim(),
      body: dto.body.trim(),
      created_at: now,
      updated_at: now,
    };
    this.demoStore.announcements.unshift(announcement);
    return announcement;
  }

  async deleteAnnouncement(user: AuthenticatedUser, id: string) {
    this.assertStaff(user);

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { error } = await admin.from('announcements').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { deleted: true };
    }

    const idx = this.demoStore.announcements.findIndex((a) => a.id === id);
    if (idx === -1) throw new NotFoundException('Announcement not found.');
    this.demoStore.announcements.splice(idx, 1);
    return { deleted: true };
  }

  async createFeeItem(user: AuthenticatedUser, dto: CreateFeeItemDto) {
    this.assertStaff(user);

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data, error } = await admin
        .from('fee_items')
        .insert({
          organization_id: dto.organizationId,
          name: dto.name.trim(),
          amount_centavos: dto.amountCentavos,
          semester: dto.semester.trim(),
          school_year: dto.schoolYear.trim(),
          is_active: true,
        })
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const record: FeeItemRecord = {
      id: this.demoStore.nextId(),
      organization_id: dto.organizationId,
      name: dto.name.trim(),
      amount_centavos: dto.amountCentavos,
      semester: dto.semester.trim(),
      school_year: dto.schoolYear.trim(),
      is_active: true,
    };
    this.demoStore.feeItems.push(record);
    return record;
  }

  async checkoutPayment(user: AuthenticatedUser, dto: CheckoutPaymentDto) {
    const checkoutRef = `cs_ccis_${randomBytes(5).toString('hex')}`;
    const paymentRef = `pay_ccis_${randomBytes(5).toString('hex')}`;
    const receiptNo = `OR-CCIS-${new Date().getFullYear()}-${Math.floor(
      100000 + Math.random() * 900000,
    )}`;
    const now = new Date().toISOString();

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data: feeItem } = await admin
        .from('fee_items')
        .select('*')
        .eq('id', dto.feeItemId)
        .maybeSingle();
      if (!feeItem) throw new NotFoundException('Fee item not found.');

      const { data: alreadyPaid } = await admin
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('fee_item_id', dto.feeItemId)
        .eq('status', 'PAID')
        .maybeSingle();
      if (alreadyPaid) {
        throw new BadRequestException('This fee item is already settled.');
      }

      const { data: payment, error: payErr } = await admin
        .from('payments')
        .insert({
          user_id: user.id,
          fee_item_id: dto.feeItemId,
          amount_centavos: feeItem.amount_centavos,
          status: 'PAID',
          paymongo_checkout_id: checkoutRef,
          paymongo_payment_id: paymentRef,
          paid_at: now,
        })
        .select('*')
        .single();
      if (payErr) throw new BadRequestException(payErr.message);

      const { data: receipt, error: recErr } = await admin
        .from('receipts')
        .insert({
          payment_id: payment.id,
          receipt_no: receiptNo,
          receipt_url: `/dashboard?tab=finance&receipt=${receiptNo}`,
        })
        .select('*')
        .single();
      if (recErr) throw new BadRequestException(recErr.message);

      return { payment, receipt };
    }

    const feeItem = this.demoStore.feeItems.find(
      (f) => f.id === dto.feeItemId,
    );
    if (!feeItem) throw new NotFoundException('Fee item not found.');

    const existingPaid = this.demoStore.payments.find(
      (p) =>
        p.user_id === user.id &&
        p.fee_item_id === dto.feeItemId &&
        p.status === 'PAID',
    );
    if (existingPaid) {
      throw new BadRequestException('This fee item is already settled.');
    }

    const payment: PaymentRecord = {
      id: this.demoStore.nextId(),
      user_id: user.id,
      fee_item_id: feeItem.id,
      amount_centavos: feeItem.amount_centavos,
      status: 'PAID',
      paymongo_checkout_id: checkoutRef,
      paymongo_payment_id: paymentRef,
      paid_at: now,
    };
    this.demoStore.payments.unshift(payment);

    const receipt: ReceiptRecord = {
      id: this.demoStore.nextId(),
      payment_id: payment.id,
      receipt_no: receiptNo,
      receipt_url: `/dashboard?tab=finance&receipt=${receiptNo}`,
    };
    this.demoStore.receipts.push(receipt);

    return { payment, receipt };
  }

  async upsertClearance(user: AuthenticatedUser, dto: UpsertClearanceDto) {
    this.assertStaff(user);
    const collegeId =
      dto.collegeId ||
      user.college?.id ||
      this.demoStore.colleges[0]?.id;

    if (!collegeId) {
      throw new BadRequestException('A valid college_id is required.');
    }

    const now = new Date().toISOString();

    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();
      const { data: existing } = await admin
        .from('clearances')
        .select('id')
        .eq('user_id', dto.userId)
        .eq('college_id', collegeId)
        .eq('semester', dto.semester.trim())
        .maybeSingle();

      if (existing) {
        const { data, error } = await admin
          .from('clearances')
          .update({
            status: dto.status,
            issued_by: user.id,
            issued_at: now,
          })
          .eq('id', existing.id)
          .select('*')
          .single();
        if (error) throw new BadRequestException(error.message);
        return data;
      }

      const { data, error } = await admin
        .from('clearances')
        .insert({
          user_id: dto.userId,
          college_id: collegeId,
          semester: dto.semester.trim(),
          status: dto.status,
          issued_by: user.id,
          issued_at: now,
        })
        .select('*')
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    }

    const existing = this.demoStore.clearances.find(
      (c) =>
        c.user_id === dto.userId &&
        c.college_id === collegeId &&
        c.semester.toLowerCase() === dto.semester.trim().toLowerCase(),
    );

    if (existing) {
      existing.status = dto.status;
      existing.issued_by = user.id;
      existing.issued_at = now;
      return existing;
    }

    const record: ClearanceRecord = {
      id: this.demoStore.nextId(),
      user_id: dto.userId,
      college_id: collegeId,
      semester: dto.semester.trim(),
      status: dto.status,
      issued_by: user.id,
      issued_at: now,
    };
    this.demoStore.clearances.unshift(record);
    return record;
  }

  async updateProfile(
    user: AuthenticatedUser,
    dto: UpdateStudentProfileDto,
  ): Promise<AuthenticatedUser> {
    if (this.supabaseService.isConfigured()) {
      const admin = this.supabaseService.getAdminClient();

      if (dto.fullName !== undefined || dto.username !== undefined) {
        const updates: Record<string, unknown> = {};
        if (dto.fullName?.trim()) updates.full_name = dto.fullName.trim();
        if (dto.username !== undefined) {
          updates.username = dto.username.trim() || null;
        }
        if (Object.keys(updates).length > 0) {
          const { error } = await admin
            .from('users')
            .update(updates)
            .eq('id', user.id);
          if (error) throw new BadRequestException(error.message);
        }
      }

      const profilePayload = {
        user_id: user.id,
        student_no: dto.studentNo?.trim() || null,
        contact_no: dto.contactNo?.trim() || null,
        region_code: dto.regionCode?.trim() || null,
        region_name: dto.regionName?.trim() || null,
        province_code: dto.provinceCode?.trim() || null,
        province_name: dto.provinceName?.trim() || null,
        city_code: dto.cityCode?.trim() || null,
        city_name: dto.cityName?.trim() || null,
        barangay_code: dto.barangayCode?.trim() || null,
        barangay_name: dto.barangayName?.trim() || null,
      };

      const { data: existingProfile } = await admin
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        const { error } = await admin
          .from('student_profiles')
          .update(profilePayload)
          .eq('id', existingProfile.id);
        if (error) throw new BadRequestException(error.message);
      } else {
        const { error } = await admin
          .from('student_profiles')
          .insert(profilePayload);
        if (error) throw new BadRequestException(error.message);
      }

      const { data: updatedUser } = await admin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      return this.authService.hydrateSupabaseUser(updatedUser as UserRecord);
    }

    const targetUser = this.demoStore.users.find((u) => u.id === user.id);
    if (!targetUser) throw new NotFoundException('User not found.');

    if (dto.fullName?.trim()) {
      targetUser.full_name = dto.fullName.trim();
    }
    if (dto.username !== undefined) {
      targetUser.username = dto.username.trim() || null;
    }

    let profile = this.demoStore.studentProfiles.find(
      (sp) => sp.user_id === user.id,
    );
    if (!profile) {
      profile = {
        id: this.demoStore.nextId(),
        user_id: user.id,
        student_no: null,
        contact_no: null,
        region_code: null,
        region_name: null,
        province_code: null,
        province_name: null,
        city_code: null,
        city_name: null,
        barangay_code: null,
        barangay_name: null,
      };
      this.demoStore.studentProfiles.push(profile);
    }

    if (dto.studentNo !== undefined)
      profile.student_no = dto.studentNo.trim() || null;
    if (dto.contactNo !== undefined)
      profile.contact_no = dto.contactNo.trim() || null;
    if (dto.regionCode !== undefined)
      profile.region_code = dto.regionCode.trim() || null;
    if (dto.regionName !== undefined)
      profile.region_name = dto.regionName.trim() || null;
    if (dto.provinceCode !== undefined)
      profile.province_code = dto.provinceCode.trim() || null;
    if (dto.provinceName !== undefined)
      profile.province_name = dto.provinceName.trim() || null;
    if (dto.cityCode !== undefined)
      profile.city_code = dto.cityCode.trim() || null;
    if (dto.cityName !== undefined)
      profile.city_name = dto.cityName.trim() || null;
    if (dto.barangayCode !== undefined)
      profile.barangay_code = dto.barangayCode.trim() || null;
    if (dto.barangayName !== undefined)
      profile.barangay_name = dto.barangayName.trim() || null;

    return this.demoStore.buildAuthenticatedUser(targetUser);
  }
}
