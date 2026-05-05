# Webinar Registration Form — Design Spec
Date: 2026-05-05

## Goal
Replace the third-party iframe (LeadConnector) in `/webinar` with a native form that matches the page's design system. The form collects name, phone, and email, and submits via a Next.js server action.

## Files affected
- `app/webinar/page.tsx` — remove `WebinarRegistrationForm` component and `<Script>` import, add `<WebinarForm />`
- `app/webinar/WebinarForm.tsx` — new client component (created)
- `app/actions.ts` — update `handleWebinarSubmission` to accept and use `phone` field

## Component: WebinarForm (`app/webinar/WebinarForm.tsx`)

**Type:** `"use client"`

**State:** `useActionState(handleWebinarSubmission, null)` — tracks pending state and error message returned from the server action.

**Visual structure (top to bottom):**
1. Eyebrow label — `REGISTRO GRATUITO` in small caps, color `#9a7b45`
2. Heading — `Reserva tu lugar en el webinar`, serif font, ~`text-2xl`
3. Description — `"Te enviaremos el acceso y lo que necesites para prepararte sin prisa, sin ruido."`, muted color `#5c4f42`
4. Divider — subtle `border-t border-[#dcd0c4]/60`
5. Fields — Nombre, Teléfono, Correo electrónico (each with a visible label above)
6. Submit button — full width, dark background `#2a231c`, text `RESERVA TU LUGAR GRATIS`, uppercase tracking
7. Feedback — spinner icon while pending (via `useFormStatus`), inline error message if action returns error

**Styling:** Consistent with page palette — `bg-[#f4ede4]`, borders `#dcd0c4`, inputs with `bg-white/60` and `border border-[#dcd0c4]`, focus ring in `#9a7b45`.

## Server action update (`app/actions.ts`)

`handleWebinarSubmission` receives `phone` from `formData.get('phone')`. Phone is included in the confirmation email body. No other logic changes. Redirect to `/webinar/gracias` on success.

The action's return signature changes to support error states: returns `{ error: string }` on validation failure instead of throwing, so `useActionState` can display it inline without a full page error.

## Data flow
```
User fills form
  → form action triggers handleWebinarSubmission (server)
    → validates email presence
    → sends confirmation email (name, phone in body)
    → redirect('/webinar/gracias')  ← on success
    → returns { error: '...' }      ← on validation failure
```

## What is NOT in scope
- Saving leads to a database
- CRM integration
- Phone validation beyond basic presence check
- Any change to `/webinar/gracias` page
