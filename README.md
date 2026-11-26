# CCISLSG — Local Student Government Hub

Full-stack Local Student Government portal for **CCISLSG** (College of Computing and Information Sciences Local Student Government), aligned with the complete CCISLSG PostgreSQL / Supabase ERD.

## Tech Stack
- **Frontend**: Next.js 15 (App Router, TypeScript) + Tailwind CSS + Shadcn UI
- **Backend**: NestJS 10 (TypeScript) + Built-in Visual CAPTCHA + JWT / Supabase Guard
- **Database**: PostgreSQL via Supabase ([`supabase/schema.sql`](./supabase/schema.sql))

## Implemented ERD Tables & Modules
1. **`colleges` & `organizations` & `org_officers` & `membership_requirements`**: Register LSG/ORG bodies, assign officers, and define accreditation requirements.
2. **`users` & `student_profiles`**: Login with `email`, `username`, or `student_no` + `password_hash` + visual CAPTCHA; edit PSGC region/province/city/barangay & contact details.
3. **`memberships` & `membership_files`**: Apply to organizations with document links/keys; officers verify (`APPROVED` / `REJECTED` / `PENDING`).
4. **`announcements`**: Publish and filter official dispatches per organization.
5. **`fee_items`, `payments`, & `receipts`**: Create semester fees (`amount_centavos`), settle via PayMongo checkout, and issue official digital receipts (`receipt_no`).
6. **`clearances`**: Track and sign semesterly `CCIS` clearances (`CLEARED` / `PENDING` / `HOLD`).

## Quick Start

### 1. Start the NestJS Backend (Port `4000`)
```bash
cd backend
npm install
npm run start:dev
```

### 2. Start the Next.js Frontend (Port `3000`)
```bash
cd frontend
npm install
npm run dev
```

## Demo Accounts (and Seeded Supabase Accounts)
- **LSG Officer**: `governor@ccislsg.edu.ph` / `ariana.reyes` / `2023-00101` — Password: `password123`
- **CCIS Student**: `student@ccislsg.edu.ph` / `mateo.villanueva` / `2024-00418` — Password: `password123`
