# CRM Campanas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/crm/campanas` so CRM users can create email campaigns, segment recipients by contacts, pipeline stages, forms, webinars, and project/course filters, then send and track delivery attempts.

**Architecture:** Store campaigns and recipient send attempts in Prisma so each send is auditable and retryable. Keep filter definitions as structured JSON, but resolve recipients through indexed relations on contacts, deals, form submissions, and webinar registrations. Use Server Actions for authenticated mutations and nodemailer for SMTP delivery.

**Tech Stack:** Next.js App Router, React Server Components, Server Actions, Prisma 7 with MariaDB adapter, nodemailer, Node test runner.

---

### Task 1: Segment Rules

**Files:**
- Create: `app/crm/campanas/_lib/segments.test.ts`
- Create: `app/crm/campanas/_lib/segments.ts`

- [ ] Write a failing Node test for segment filter normalization and Prisma where building.
- [ ] Run `node --import tsx --test app/crm/campanas/_lib/segments.test.ts` and confirm it fails because the implementation does not exist.
- [ ] Implement `normalizeCampaignFilters`, `buildCampaignContactWhere`, and `formatCampaignAudience`.
- [ ] Re-run the segment test and confirm it passes.

### Task 2: Database Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] Add campaign status enums, campaign models, and relations to `User` and `Contact`.
- [ ] Add indexes for campaign listings and recipient lookups.
- [ ] Add supporting indexes on contacts, deals, webinar registrations, and form submissions used by segmentation.

### Task 3: Campaign Actions

**Files:**
- Create: `lib/mailer.ts`
- Create: `app/crm/campanas/actions.ts`

- [ ] Create a reusable SMTP transporter helper.
- [ ] Add actions for previewing recipients, creating/updating campaigns, sending campaigns, and archiving campaigns.
- [ ] Record per-recipient status and contact activities during sends.

### Task 4: Campaign UI

**Files:**
- Modify: `app/crm/campanas/page.tsx`
- Create: `app/crm/campanas/_components/CampaignWorkspace.tsx`
- Create: `app/crm/campanas/_components/CampaignsTable.tsx`

- [ ] Render campaign composer with filters for registered contacts, pipeline lead status, project/course, forms, and webinars.
- [ ] Render recipient preview before saving.
- [ ] Render campaign table with status, counts, and guarded send/archive actions.

### Task 5: Verification

- [ ] Run `npx prisma generate`.
- [ ] Run `npx prisma db push`.
- [ ] Restart the stale dev server on port 3000.
- [ ] Run segment tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
