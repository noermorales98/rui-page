// proxy.ts - Edge auth protection for /crm and /api/crm routes
export { auth as proxy } from '@/auth'

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
    '/crm-login',
  ],
}
