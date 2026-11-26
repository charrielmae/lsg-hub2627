-- ============================================================================
-- CCISLSG Local Student Government Hub - PostgreSQL / Supabase Schema (ERD)
-- Matches the exact ERD tables, enums, and foreign keys for CCISLSG Hub.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Custom Enums (matching Prisma / ERD USER-DEFINED types)
DO $$ BEGIN
  CREATE TYPE public."Role" AS ENUM ('STUDENT', 'OFFICER', 'ORG_OFFICER', 'LSG_OFFICER', 'CCISLSG_GOVERNOR', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."OrgType" AS ENUM ('ORG', 'LSG', 'COUNCIL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public."ClearanceStatus" AS ENUM ('CLEARED', 'PENDING', 'HOLD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tables (Exact ERD Structure)

CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  CONSTRAINT colleges_pkey PRIMARY KEY (id),
  CONSTRAINT colleges_code_key UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  google_id text,
  email text NOT NULL,
  full_name text NOT NULL,
  role public."Role" NOT NULL DEFAULT 'STUDENT'::public."Role",
  college_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  password_hash text,
  username text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_username_key UNIQUE (username),
  CONSTRAINT users_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id)
);

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_no text,
  contact_no text,
  region_code text,
  region_name text,
  province_code text,
  province_name text,
  city_code text,
  city_name text,
  barangay_code text,
  barangay_name text,
  CONSTRAINT student_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT student_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT student_profiles_student_no_key UNIQUE (student_no),
  CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  type public."OrgType" NOT NULL DEFAULT 'ORG'::public."OrgType",
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id)
);

CREATE TABLE IF NOT EXISTS public.org_officers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  CONSTRAINT org_officers_pkey PRIMARY KEY (id),
  CONSTRAINT org_officers_user_org_key UNIQUE (user_id, organization_id),
  CONSTRAINT org_officers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT org_officers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.membership_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  CONSTRAINT membership_requirements_pkey PRIMARY KEY (id),
  CONSTRAINT membership_requirements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  status public."MembershipStatus" NOT NULL DEFAULT 'PENDING'::public."MembershipStatus",
  remarks text,
  verified_by uuid,
  applied_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT memberships_pkey PRIMARY KEY (id),
  CONSTRAINT memberships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT memberships_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id),
  CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.membership_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL,
  requirement_id uuid NOT NULL,
  file_url text NOT NULL,
  file_key text NOT NULL,
  CONSTRAINT membership_files_pkey PRIMARY KEY (id),
  CONSTRAINT membership_files_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE,
  CONSTRAINT membership_files_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.membership_requirements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.fee_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  amount_centavos integer NOT NULL,
  semester text NOT NULL,
  school_year text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT fee_items_pkey PRIMARY KEY (id),
  CONSTRAINT fee_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fee_item_id uuid NOT NULL,
  amount_centavos integer NOT NULL,
  status public."PaymentStatus" NOT NULL DEFAULT 'PENDING'::public."PaymentStatus",
  paymongo_checkout_id text,
  paymongo_payment_id text,
  paid_at timestamp with time zone,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT payments_fee_item_id_fkey FOREIGN KEY (fee_item_id) REFERENCES public.fee_items(id)
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  receipt_no text NOT NULL,
  receipt_url text,
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_payment_id_key UNIQUE (payment_id),
  CONSTRAINT receipts_receipt_no_key UNIQUE (receipt_no),
  CONSTRAINT receipts_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.clearances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  college_id uuid NOT NULL,
  semester text NOT NULL,
  status public."ClearanceStatus" NOT NULL DEFAULT 'CLEARED'::public."ClearanceStatus",
  issued_by uuid NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT clearances_pkey PRIMARY KEY (id),
  CONSTRAINT clearances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT clearances_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.colleges(id),
  CONSTRAINT clearances_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES public.users(id)
);

-- 3. Indexes on Foreign Keys & Lookup Columns (Postgres Performance Best Practices)
CREATE INDEX IF NOT EXISTS users_college_id_idx ON public.users (college_id);
CREATE INDEX IF NOT EXISTS student_profiles_user_id_idx ON public.student_profiles (user_id);
CREATE INDEX IF NOT EXISTS student_profiles_student_no_idx ON public.student_profiles (student_no);
CREATE INDEX IF NOT EXISTS organizations_college_id_idx ON public.organizations (college_id);
CREATE INDEX IF NOT EXISTS org_officers_user_id_idx ON public.org_officers (user_id);
CREATE INDEX IF NOT EXISTS org_officers_organization_id_idx ON public.org_officers (organization_id);
CREATE INDEX IF NOT EXISTS membership_requirements_organization_id_idx ON public.membership_requirements (organization_id);
CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON public.memberships (user_id);
CREATE INDEX IF NOT EXISTS memberships_organization_id_idx ON public.memberships (organization_id);
CREATE INDEX IF NOT EXISTS memberships_verified_by_idx ON public.memberships (verified_by);
CREATE INDEX IF NOT EXISTS membership_files_membership_id_idx ON public.membership_files (membership_id);
CREATE INDEX IF NOT EXISTS membership_files_requirement_id_idx ON public.membership_files (requirement_id);
CREATE INDEX IF NOT EXISTS announcements_organization_id_idx ON public.announcements (organization_id);
CREATE INDEX IF NOT EXISTS announcements_author_id_idx ON public.announcements (author_id);
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements (created_at DESC);
CREATE INDEX IF NOT EXISTS fee_items_organization_id_idx ON public.fee_items (organization_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_fee_item_id_idx ON public.payments (fee_item_id);
CREATE INDEX IF NOT EXISTS receipts_payment_id_idx ON public.receipts (payment_id);
CREATE INDEX IF NOT EXISTS clearances_user_id_idx ON public.clearances (user_id);
CREATE INDEX IF NOT EXISTS clearances_college_id_idx ON public.clearances (college_id);
CREATE INDEX IF NOT EXISTS clearances_issued_by_idx ON public.clearances (issued_by);

-- 4. Enable Row Level Security (RLS) across all exposed public tables
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clearances ENABLE ROW LEVEL SECURITY;

-- Baseline read policies for authenticated Supabase sessions (NestJS uses service_role key)
DROP POLICY IF EXISTS "Authenticated users read colleges" ON public.colleges;
CREATE POLICY "Authenticated users read colleges"
  ON public.colleges FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users read active organizations" ON public.organizations;
CREATE POLICY "Authenticated users read active organizations"
  ON public.organizations FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users read announcements" ON public.announcements;
CREATE POLICY "Authenticated users read announcements"
  ON public.announcements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users read fee items" ON public.fee_items;
CREATE POLICY "Authenticated users read fee items"
  ON public.fee_items FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users read own user row" ON public.users;
CREATE POLICY "Users read own user row"
  ON public.users FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users read own student profile" ON public.student_profiles;
CREATE POLICY "Users read own student profile"
  ON public.student_profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own student profile" ON public.student_profiles;
CREATE POLICY "Users manage own student profile"
  ON public.student_profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own memberships" ON public.memberships;
CREATE POLICY "Users read own memberships"
  ON public.memberships FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
CREATE POLICY "Users read own payments"
  ON public.payments FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users read own clearances" ON public.clearances;
CREATE POLICY "Users read own clearances"
  ON public.clearances FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 5. Seed Initial CCISLSG Hub Data (Idempotent)
INSERT INTO public.colleges (id, code, name)
VALUES (
  '11111111-1111-4111-8111-111111111111',
  'CCIS',
  'College of Computing and Information Sciences'
)
ON CONFLICT (code) DO NOTHING;

-- Seed Officer & Student accounts
INSERT INTO public.users (id, email, username, full_name, role, college_id, is_active, password_hash)
VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'charrielmae.ayuban@carsu.edu.ph',
    'charrielmae.ayuban',
    'Charriel Mae Ayuban',
    'CCISLSG_GOVERNOR'::public."Role",
    '11111111-1111-4111-8111-111111111111',
    true,
    'sha256:ccislsg:' || encode(digest('ccislsg:06162005', 'sha256'), 'hex')
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'charlesgerald.ayuban@carsu.edu.ph',
    'charlesgerald.ayuban',
    'Charles Gerald Ayuban',
    'STUDENT'::public."Role",
    '11111111-1111-4111-8111-111111111111',
    true,
    'sha256:ccislsg:' || encode(digest('ccislsg:charlesgerald123', 'sha256'), 'hex')
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.student_profiles (
  id, user_id, student_no, contact_no,
  region_code, region_name, province_code, province_name,
  city_code, city_name, barangay_code, barangay_name
)
VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    '00000000-0000-4000-8000-000000000001',
    '2023-00101',
    '0917-555-0101',
    '160000000', 'Caraga Region (Region XIII)', '160200000', 'Agusan del Norte',
    '8600', 'Butuan City', '160202003', 'Ampayon'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '00000000-0000-4000-8000-000000000002',
    '2024-00418',
    '0918-555-0418',
    '160000000', 'Caraga Region (Region XIII)', '160200000', 'Agusan del Norte',
    '8600', 'Butuan City', '160202003', 'Ampayon'
  )
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.organizations (id, college_id, name, description, type, is_active)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111111',
    'CCIS Local Student Government (CCISLSG)',
    'Official college-wide autonomous student government representing BSCS, BSIT, BSIS, and BLIS constituents.',
    'LSG'::public."OrgType",
    true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111111',
    'CCIS Computing & Guild Society',
    'Academic organization for software engineering, competitive programming, and hackathons.',
    'ORG'::public."OrgType",
    true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '11111111-1111-4111-8111-111111111111',
    'Information & Library Science Association',
    'Recognized co-curricular organization for BSIS and BLIS students.',
    'ORG'::public."OrgType",
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.org_officers (id, user_id, organization_id)
VALUES (
  '44444444-4444-4444-8444-444444444401',
  '00000000-0000-4000-8000-000000000001',
  '33333333-3333-4333-8333-333333333301'
)
ON CONFLICT (user_id, organization_id) DO NOTHING;
