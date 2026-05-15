# Deploy Checklist — Rui CRM

## Pre-Deploy: Vercel Environment Variables

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

## Campaign Cron (Vercel)

The cron job at `/api/jobs/campaigns` runs every 5 minutes on Vercel Pro.  
On Hobby plan, change `schedule` in `vercel.json` to `"0 * * * *"` (hourly).

Vercel automatically sets `CRON_SECRET` — the cron runner accepts it as auth.

## Post-Deploy Smoke Tests

- [ ] `/crm-login` loads and login works with seeded admin account
- [ ] Logged-in user visiting `/crm-login` gets redirected to `/crm/dashboard`
- [ ] `/crm/dashboard` shows metrics (not blank/error)
- [ ] `/crm/contactos` lists contacts, search works
- [ ] Create a contact → appears in list → click detail → timeline visible
- [ ] `/crm/pipeline` kanban loads; drag a deal to another column
- [ ] `/api/stripe/webhook` returns 400 (not 500) for malformed payload
- [ ] Send a test campaign to 1 contact → recipient shows SENT
- [ ] Cron route GET `/api/jobs/campaigns` returns 401 without auth header
- [ ] Cron route GET returns 200 with `Authorization: Bearer $JOBS_SECRET`
- [ ] Public form at `/formularios/[slug]` submits and creates contact
- [ ] Embed at `/embed/formularios/[slug]` loads in an iframe (no X-Frame-Options: DENY)
- [ ] CRM pages have `X-Frame-Options: DENY` in response headers (check DevTools → Network)
- [ ] CRM pages have `Strict-Transport-Security` header in production
- [ ] Unauthenticated request to `/crm/dashboard` redirects to `/crm-login`
- [ ] Unauthenticated request to `/api/crm/contacts-search` returns 401
