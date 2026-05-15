# Sprint 12 — Hardening + Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the production surface (security headers, auth middleware, env vars) and wire up Vercel deployment with campaign cron jobs.

**Architecture:** Four independent hardening layers — Edge middleware for auth-at-the-edge, Next.js response headers for CSP/HSTS/X-Frame, `.env.example` consolidation for onboarding, and a cron runner route + `vercel.json` for automated campaign processing. No new database models needed.

**Tech Stack:** Next.js 16 App Router, Auth.js v5 (`next-auth@5 beta`), Vercel Cron (via `vercel.json`), Node.js crypto (already in `lib/integrations/crypto.ts`)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `middleware.ts` | **Create** | Edge auth guard for `/crm` and `/api/crm` routes |
| `next.config.ts` | **Modify** | Add security headers (X-Frame-Options, HSTS, CSP, etc.) |
| `.env.example` | **Modify** | Add missing vars: DATABASE_URL, AUTH_SECRET, AUTH_URL, SMTP_* |
| `app/api/jobs/campaigns/route.ts` | **Create** | Cron runner — finds SENDING campaigns, calls batch worker per campaign |
| `vercel.json` | **Create** | Cron schedule for campaign runner, max duration override |

---

## Task 1: Edge Auth Middleware

Protect all `/crm` pages and `/api/crm` endpoints at the Edge before any RSC renders. Auth.js v5 exports `auth` which works as middleware directly.

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create `middleware.ts`**

```typescript
// middleware.ts
export { auth as middleware } from '@/auth'

export const config = {
  matcher: [
    /*
     * Match all /crm routes and /api/crm routes.
     * Exclude:
     *  - /api/auth/* (Auth.js own endpoints)
     *  - /api/stripe/webhook (raw body, signature-verified)
     *  - /api/zoom/webhook  (token-verified)
     *  - /api/forms/*      (public form submissions)
     *  - /api/jobs/*       (JOBS_SECRET-verified)
     *  - /embed/*          (public iframe embed)
     *  - static assets
     */
    '/crm/:path*',
    '/api/crm/:path*',
  ],
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Verify the dev server still boots**

```bash
cd /Users/noeli/Documents/Develop/rui && npx next build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` with no errors. (Or build succeeds — warnings are ok.)

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat: add edge auth middleware for /crm and /api/crm routes"
```

---

## Task 2: Security Response Headers

Add security headers via `next.config.ts`. The embed route at `/embed/:path*` must allow iframing (no X-Frame-Options), so we set headers per-path. CSP uses `frame-ancestors 'none'` for CRM pages and omits it for embed pages.

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace the content of `next.config.ts`**

```typescript
import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // Only meaningful over HTTPS; harmless on HTTP.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // All routes get the baseline security headers.
        source: '/:path*',
        headers: [
          ...securityHeaders,
          // Deny framing everywhere by default.
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'",
          },
        ],
      },
      {
        // Embed pages must be frameable — override X-Frame-Options + CSP.
        // The embed route renders public form iframes.
        source: '/embed/:path*',
        headers: [
          ...securityHeaders,
          // Remove DENY by setting SAMEORIGIN (browsers use last-wins for
          // duplicate headers, but Next.js merges arrays — the specific
          // source override replaces the global one).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ]
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Run build to confirm headers compile**

```bash
cd /Users/noeli/Documents/Develop/rui && npx next build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: add security response headers (CSP, HSTS, X-Frame-Options)"
```

---

## Task 3: `.env.example` Final Consolidation

The current `.env.example` is missing several critical variables. A developer onboarding fresh cannot start the app without DATABASE_URL, AUTH_SECRET, or SMTP config.

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Replace `.env.example` with the complete set**

```bash
# ─── Database ────────────────────────────────────────────────────────────────
# MariaDB connection string
DATABASE_URL="mysql://user:password@localhost:3306/rui_crm"

# ─── Auth ─────────────────────────────────────────────────────────────────────
# Generate: openssl rand -base64 32
AUTH_SECRET=change-me-at-least-32-chars

# Base URL of the app (no trailing slash). Used by Auth.js for callbacks.
AUTH_URL=http://localhost:3000

# ─── SMTP (Nodemailer) ───────────────────────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=smtp-password
SMTP_FROM="Rui Machalele <noreply@example.com>"

# ─── Zoom OAuth ───────────────────────────────────────────────────────────────
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_REDIRECT_URI=https://tudominio.com/api/zoom/oauth/callback
ZOOM_VERIFICATION_TOKEN=

# ─── Encryption ───────────────────────────────────────────────────────────────
# AES-256-GCM key for Integration.config (Zoom tokens, etc.)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
INTEGRATION_ENC_KEY=

# ─── Stripe ──────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:3000/crm/ventas?stripe=success
STRIPE_CANCEL_URL=http://localhost:3000/crm/ventas?stripe=cancel

# ─── Jobs ─────────────────────────────────────────────────────────────────────
# Bearer token for internal cron job routes. Use a strong random string in production.
# Generate: openssl rand -hex 32
JOBS_SECRET=change-me-random-secret
```

- [ ] **Step 2: Verify the file looks correct**

```bash
cat /Users/noeli/Documents/Develop/rui/.env.example
```

Expected: all sections visible with no placeholder TBDs.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: consolidate .env.example with all required vars"
```

---

## Task 4: Campaign Cron Runner Route

Vercel Cron can call one URL on a schedule. The existing batch worker at `/api/jobs/campaign/[id]` handles ONE campaign at a time. This task creates `/api/jobs/campaigns` (plural, no ID) that:

1. Finds all campaigns in `SENDING` status with pending recipients.
2. POSTs to the per-campaign batch route for each (self-call via `fetch`).
3. Returns a summary.

**Files:**
- Create: `app/api/jobs/campaigns/route.ts`

- [ ] **Step 1: Create `app/api/jobs/campaigns/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
// Vercel Hobby max is 60s; Pro is 300s. Give ourselves 55s of headroom.
export const maxDuration = 55

function verifyJobToken(req: NextRequest): boolean {
  const secret = process.env.JOBS_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyJobToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find campaigns that still have pending recipients.
  const sendingCampaigns = await prisma.crmCampaign.findMany({
    where: {
      status: { in: ['SENDING', 'PARTIAL', 'FAILED'] },
      recipients: { some: { status: 'PENDING' } },
    },
    select: { id: true, name: true },
  })

  if (sendingCampaigns.length === 0) {
    return NextResponse.json({ processed: 0, campaigns: [] })
  }

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
  const jobSecret = process.env.JOBS_SECRET!

  const results: { id: number; name: string; sent: number; failed: number; remaining: number }[] = []

  for (const campaign of sendingCampaigns) {
    try {
      const res = await fetch(`${baseUrl}/api/jobs/campaign/${campaign.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${jobSecret}`,
          'content-type': 'application/json',
        },
      })
      if (res.ok) {
        const data = (await res.json()) as { sent: number; failed: number; remaining: number }
        results.push({ id: campaign.id, name: campaign.name, ...data })
      } else {
        results.push({ id: campaign.id, name: campaign.name, sent: 0, failed: 0, remaining: -1 })
      }
    } catch {
      results.push({ id: campaign.id, name: campaign.name, sent: 0, failed: 0, remaining: -1 })
    }
  }

  return NextResponse.json({ processed: results.length, campaigns: results })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/api/jobs/campaigns/route.ts
git commit -m "feat: add campaign cron runner route /api/jobs/campaigns"
```

---

## Task 5: `vercel.json` — Cron + Max Duration

Wire up the campaign runner as a Vercel Cron job. On Vercel, cron jobs make GET requests (not POST), so we need the route to accept GET too. Update the runner to accept both methods using the same token verification.

Also override function max duration for the webhook routes that may process large payloads.

**Files:**
- Modify: `app/api/jobs/campaigns/route.ts` (add GET handler)
- Create: `vercel.json`

- [ ] **Step 1: Add GET handler to `app/api/jobs/campaigns/route.ts`**

Vercel Cron sends a GET request with a `x-vercel-cron-signature` header. For simplicity, we use `CRON_SECRET` env var (Vercel sets it automatically when using `vercel.json` crons). Replace the file content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const maxDuration = 55

function verifyRequest(req: NextRequest): boolean {
  const jobSecret = process.env.JOBS_SECRET
  const cronSecret = process.env.CRON_SECRET

  // Manual call via Bearer token
  const authHeader = req.headers.get('authorization')
  if (jobSecret && authHeader === `Bearer ${jobSecret}`) return true

  // Vercel Cron — passes the CRON_SECRET as bearer token
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  return false
}

async function runCampaigns(baseUrl: string, jobSecret: string) {
  const sendingCampaigns = await prisma.crmCampaign.findMany({
    where: {
      status: { in: ['SENDING', 'PARTIAL', 'FAILED'] },
      recipients: { some: { status: 'PENDING' } },
    },
    select: { id: true, name: true },
  })

  if (sendingCampaigns.length === 0) {
    return { processed: 0, campaigns: [] }
  }

  const results: { id: number; name: string; sent: number; failed: number; remaining: number }[] = []

  for (const campaign of sendingCampaigns) {
    try {
      const res = await fetch(`${baseUrl}/api/jobs/campaign/${campaign.id}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${jobSecret}`,
          'content-type': 'application/json',
        },
      })
      if (res.ok) {
        const data = (await res.json()) as { sent: number; failed: number; remaining: number }
        results.push({ id: campaign.id, name: campaign.name, ...data })
      } else {
        results.push({ id: campaign.id, name: campaign.name, sent: 0, failed: 0, remaining: -1 })
      }
    } catch {
      results.push({ id: campaign.id, name: campaign.name, sent: 0, failed: 0, remaining: -1 })
    }
  }

  return { processed: results.length, campaigns: results }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
  const jobSecret = process.env.JOBS_SECRET!
  const result = await runCampaigns(baseUrl, jobSecret)
  return NextResponse.json(result)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!verifyRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
  const jobSecret = process.env.JOBS_SECRET!
  const result = await runCampaigns(baseUrl, jobSecret)
  return NextResponse.json(result)
}
```

- [ ] **Step 2: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/jobs/campaigns",
      "schedule": "*/5 * * * *"
    }
  ],
  "functions": {
    "app/api/jobs/campaigns/route.ts": {
      "maxDuration": 55
    },
    "app/api/jobs/campaign/[id]/route.ts": {
      "maxDuration": 55
    },
    "app/api/stripe/webhook/route.ts": {
      "maxDuration": 30
    }
  }
}
```

> Note on Vercel Cron: On Vercel's free Hobby plan, crons run at most once per day. The `*/5 * * * *` schedule (every 5 min) requires a Pro plan. On Hobby, use `0 * * * *` (hourly). Adjust based on your plan.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add app/api/jobs/campaigns/route.ts vercel.json
git commit -m "feat: add vercel.json cron for campaign runner (every 5 min)"
```

---

## Task 6: Smoke Test Checklist Doc

A production verification checklist so you don't forget anything when going live.

**Files:**
- Create: `docs/DEPLOY.md`

- [ ] **Step 1: Create `docs/DEPLOY.md`**

```markdown
# Deploy Checklist — Rui CRM

## Pre-Deploy (Vercel Environment Variables)

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `mysql://user:pass@host/db` | Prod MariaDB |
| `AUTH_SECRET` | `openssl rand -base64 32` | Must be ≥32 chars |
| `AUTH_URL` | `https://tudominio.com` | No trailing slash |
| `SMTP_HOST` | `smtp.sendgrid.net` | |
| `SMTP_PORT` | `587` | |
| `SMTP_SECURE` | `false` | `true` for port 465 |
| `SMTP_USER` | `apikey` | SendGrid user |
| `SMTP_PASS` | `SG.xxx` | SendGrid API key |
| `SMTP_FROM` | `"Rui <noreply@tudominio.com>"` | |
| `ZOOM_CLIENT_ID` | | From Zoom Marketplace |
| `ZOOM_CLIENT_SECRET` | | From Zoom Marketplace |
| `ZOOM_REDIRECT_URI` | `https://tudominio.com/api/zoom/oauth/callback` | Must match Zoom app |
| `ZOOM_VERIFICATION_TOKEN` | | From Zoom webhook config |
| `INTEGRATION_ENC_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | 64 hex chars |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Live key for prod |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe Dashboard → Webhooks |
| `STRIPE_SUCCESS_URL` | `https://tudominio.com/crm/ventas?stripe=success` | |
| `STRIPE_CANCEL_URL` | `https://tudominio.com/crm/ventas?stripe=cancel` | |
| `JOBS_SECRET` | `openssl rand -hex 32` | |

## Stripe Webhook Setup

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://tudominio.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `charge.refunded`, `payment_intent.payment_failed`
4. Copy `whsec_...` → `STRIPE_WEBHOOK_SECRET`

## Zoom App Setup

1. Zoom Marketplace → Build App → OAuth
2. Redirect URL: `https://tudominio.com/api/zoom/oauth/callback`
3. Feature → Event Subscriptions → Webhook URL: `https://tudominio.com/api/zoom/webhook`
4. Subscribe to: `webinar.registration_created`, `webinar.participant_joined`

## Post-Deploy Smoke Tests

- [ ] `/crm-login` loads, login works with seeded admin account
- [ ] `/crm/dashboard` shows metrics (not blank/error)
- [ ] `/crm/contactos` lists contacts, search works
- [ ] Create a contact → appears in list → click detail → timeline visible
- [ ] `/crm/pipeline` kanban loads, drag a deal card to another column
- [ ] `/api/stripe/webhook` returns 400 (not 500) for malformed payload
- [ ] Send a test campaign to 1 contact → recipient shows SENT
- [ ] Cron route responds 401 without auth header
- [ ] Cron route responds 200 with `Bearer $JOBS_SECRET` header
- [ ] Public form at `/formularios/[slug]` submits and creates contact
- [ ] Embed at `/embed/formularios/[slug]` is frameable (no X-Frame-Options: DENY in response)
- [ ] CRM pages have `X-Frame-Options: DENY` in response headers
- [ ] CRM pages have `Strict-Transport-Security` header
```

- [ ] **Step 2: Commit**

```bash
git add docs/DEPLOY.md
git commit -m "docs: add production deploy checklist"
```

---

## Self-Review

### Spec Coverage
| Requirement | Task |
|---|---|
| CSP + security headers | Task 2 |
| Encryption of `Integration.config` | Already done (Zoom uses encrypt/decrypt from `lib/integrations/crypto.ts`) — no additional work needed |
| Rate limits on public endpoints | Forms submit already rate-limited; Stripe webhook signature-verified; Zoom webhook token-verified — no gaps |
| `.env.example` final | Task 3 |
| Deploy a Vercel + cron jobs | Tasks 4 & 5 |
| Smoke test production | Task 6 |
| Edge auth middleware (defense in depth) | Task 1 |

### Placeholder Scan
No TBDs, no "handle edge cases" vagueness — all steps have concrete code.

### Type Consistency
- `verifyRequest` in Task 5 replaces `verifyJobToken` from Task 4 — both tasks show the full file content, no stale references.
- `runCampaigns` helper in Task 5 — used by both GET and POST handlers in the same file.
