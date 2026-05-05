# Webinar Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the third-party iframe in `/webinar` with a native form (nombre, teléfono, correo) that matches the page design and submits via a Next.js server action.

**Architecture:** A new `WebinarForm` client component uses `useActionState` (from `react`) to wrap `handleWebinarSubmission`, showing a pending state and inline errors. The server action is updated to accept a `prevState` parameter (required by `useActionState`) and `phone` field, returning `{ error: string } | null` instead of throwing on validation failure.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, `useActionState` from `react`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/actions.ts` | Modify | Update `handleWebinarSubmission` signature for `useActionState` + add `phone` |
| `app/webinar/WebinarForm.tsx` | Create | Client component with the registration form UI and state |
| `app/webinar/page.tsx` | Modify | Remove old `WebinarRegistrationForm` + `Script`, add `<WebinarForm />` |

---

## Task 1: Update `handleWebinarSubmission` in `app/actions.ts`

**Files:**
- Modify: `app/actions.ts`

`useActionState` wraps the server action and calls it as `(prevState, formData)`. The function must match that signature and return state (or redirect on success).

- [ ] **Step 1: Update the function signature and body**

Replace the existing `handleWebinarSubmission` function (lines 61–88 of `app/actions.ts`) with:

```ts
export async function handleWebinarSubmission(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();

  if (!email) {
    return { error: 'El correo electrónico es obligatorio.' };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Rui Machalele" <no-reply@example.com>',
      to: email,
      subject: 'Tu lugar en el webinar está reservado',
      html: `
        <div style="font-family: Georgia, serif; line-height: 1.65; color: #3d3229; max-width: 560px;">
          <h2 style="color: #2a231c; font-weight: normal;">Hola ${name || 'allí'},</h2>
          <p>Gracias por reservar tu lugar. En breve recibirás los detalles de conexión al webinar del <strong>Método de los 4 Ángeles</strong>.</p>
          ${phone ? `<p>Te contactaremos también al <strong>${phone}</strong> si es necesario.</p>` : ''}
          <p>Si no ves el correo, revisa promociones o spam.</p>
          <p style="margin-top: 28px;">Con intención,<br /><strong>Rui Machalele</strong></p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending webinar confirmation:', error);
  }

  redirect('/webinar/gracias');
}
```

> Note: `redirect()` throws a framework exception — code after it never runs. The return type `Promise<{ error: string } | null>` is satisfied because `redirect` interrupts execution on success, and `return { error: '...' }` handles the failure path. TypeScript will accept this.

- [ ] **Step 2: Verify the file compiles**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | grep actions
```

Expected: no output (no errors in `actions.ts`).

- [ ] **Step 3: Commit**

```bash
git add app/actions.ts
git commit -m "feat: update handleWebinarSubmission to accept phone and useActionState signature"
```

---

## Task 2: Create `app/webinar/WebinarForm.tsx`

**Files:**
- Create: `app/webinar/WebinarForm.tsx`

This is the client component. It uses `useActionState` from `react` (Next.js 16 / React 19 — NOT `react-dom`). The hook returns `[state, action, pending]` where `state` is `{ error: string } | null` and `pending` is a boolean.

- [ ] **Step 1: Create the file with the full component**

```tsx
'use client';

import { useActionState } from 'react';
import { handleWebinarSubmission } from '@/app/actions';

export default function WebinarForm() {
  const [state, action, pending] = useActionState(handleWebinarSubmission, null);

  return (
    <div className="w-full max-w-[480px] rounded-sm border border-[#dcd0c4]/80 bg-[#faf6f1] p-8 shadow-[0_8px_40px_rgba(42,35,28,0.08)]">
      {/* Header */}
      <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#9a7b45]">
        Registro gratuito
      </p>
      <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug text-[#2a231c] sm:text-[1.65rem]">
        Reserva tu lugar en el webinar
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[#5c4f42]">
        Te enviaremos el acceso y lo que necesites para prepararte sin prisa, sin ruido.
      </p>

      <div className="mt-6 border-t border-[#dcd0c4]/60" />

      {/* Form */}
      <form action={action} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7560]">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            className="w-full border border-[#dcd0c4] bg-white/70 px-4 py-3 text-sm text-[#2a231c] placeholder:text-[#b5a899] focus:border-[#9a7b45] focus:outline-none focus:ring-1 focus:ring-[#9a7b45]/40"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7560]">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 000 000 0000"
            className="w-full border border-[#dcd0c4] bg-white/70 px-4 py-3 text-sm text-[#2a231c] placeholder:text-[#b5a899] focus:border-[#9a7b45] focus:outline-none focus:ring-1 focus:ring-[#9a7b45]/40"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7560]">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@correo.com"
            className="w-full border border-[#dcd0c4] bg-white/70 px-4 py-3 text-sm text-[#2a231c] placeholder:text-[#b5a899] focus:border-[#9a7b45] focus:outline-none focus:ring-1 focus:ring-[#9a7b45]/40"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 bg-[#2a231c] px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#f4ede4] shadow-[0_8px_24px_rgba(42,35,28,0.18)] transition hover:bg-[#3d3229] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Enviando…
            </>
          ) : (
            'Reserva tu lugar gratis'
          )}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1 | grep WebinarForm
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add app/webinar/WebinarForm.tsx
git commit -m "feat: add WebinarForm client component with useActionState"
```

---

## Task 3: Update `app/webinar/page.tsx`

**Files:**
- Modify: `app/webinar/page.tsx`

Remove the `WebinarRegistrationForm` function, the `Script` import, and replace the usage with `<WebinarForm />`.

- [ ] **Step 1: Replace imports and component**

The final file should look like this (full replacement):

```tsx
import Link from "next/link";
import WebinarForm from "./WebinarForm";

export default function WebinarLandingPage() {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#dcd0c4]/60 bg-[#f4ede4]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8 hidden">
          <Link
            href="/"
            className="font-serif text-lg tracking-tight text-[#2a231c] sm:text-xl"
          >
            Rui Machalele
          </Link>
          <a
            href="#registro"
            className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6b522e] hover:text-[#4a3a24] transition-colors"
          >
            Registro
          </a>
        </div>
      </header>

      <main className="bg-[#f4ede4] text-[#2a231c] pb-24 sm:pb-0">
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#dcc9a8]/35 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[#c4a574]/20 blur-3xl"
            aria-hidden
          />

          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)] lg:items-center lg:py-24">
            <div className="space-y-8 lg:pr-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#8a7560]">
                Webinar en vivo · Método de los 4 Ángeles
              </p>
              <h1 className="font-serif text-[2rem] font-semibold leading-[1.15] text-[#2a231c] sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
                Si has logrado mucho… pero sientes que algo falta, esto no es
                casualidad
              </h1>
              <p className="max-w-xl font-sans text-lg leading-relaxed text-[#5c4f42] md:text-xl">
                Descubre por qué personas exitosas siguen sintiéndose vacías y
                cómo reconectar con su propósito en 60 minutos
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <a
                  href="#registro"
                  className="inline-flex sm:hidden items-center justify-center bg-[#2a231c] px-8 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-[#f4ede4] shadow-[0_12px_32px_rgba(42,35,28,0.2)] transition hover:bg-[#3d3229] active:scale-[0.98]"
                >
                  Reserva tu lugar gratis
                </a>
                <p className="max-w-[200px] text-sm leading-snug text-[#8a7560]">
                  Para profesionales y emprendedores
                </p>
              </div>
            </div>

            <div
              id="registro"
              className="relative scroll-mt-24 lg:justify-self-end"
            >
              <WebinarForm />
            </div>
          </div>
        </section>

        <section className="border-y border-[#dcd0c4]/80 bg-[#ebe2d6]/50">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-serif text-2xl font-semibold text-[#2a231c] sm:text-3xl">
              Quizá no sea falta de disciplina
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#5c4f42]">
              A veces el éxito externo tapa una pregunta que no se va sola:{" "}
              <span className="text-[#3d3229]">¿para qué todo esto?</span>
            </p>
            <ul className="mt-12 space-y-6 border-l border-[#c4a574]/70 pl-8">
              {[
                "Has logrado estabilidad… pero no satisfacción",
                "Sientes que estás viviendo en piloto automático",
                "Tomas decisiones basadas en expectativas externas",
                "No sabes cuál es el siguiente capítulo de tu vida",
              ].map((line) => (
                <li
                  key={line}
                  className="relative text-lg leading-relaxed text-[#3d3229] before:absolute before:-left-8 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#9a7b45]"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#8a7560]">
            En este webinar descubrirás
          </p>
          <h2 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">
            Tres verdades que suelen permanecer en silencio
          </h2>
          <ul className="mt-10 space-y-8">
            <li className="flex gap-5">
              <span
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c4a574]/50 text-sm font-serif text-[#8a6b3e]"
                aria-hidden
              >
                1
              </span>
              <p className="text-lg leading-relaxed text-[#5c4f42]">
                <strong className="font-semibold text-[#2a231c]">
                  El error silencioso
                </strong>{" "}
                que desconecta a líderes de su propósito —sin que lo noten al
                mirar la cuenta bancaria.
              </p>
            </li>
            <li className="flex gap-5">
              <span
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c4a574]/50 text-sm font-serif text-[#8a6b3e]"
                aria-hidden
              >
                2
              </span>
              <p className="text-lg leading-relaxed text-[#5c4f42]">
                <strong className="font-semibold text-[#2a231c]">
                  Cómo identificar
                </strong>{" "}
                qué está bloqueando tu crecimiento cuando ya probaste
                productividad, mindset y más cursos.
              </p>
            </li>
            <li className="flex gap-5">
              <span
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c4a574]/50 text-sm font-serif text-[#8a6b3e]"
                aria-hidden
              >
                3
              </span>
              <p className="text-lg leading-relaxed text-[#5c4f42]">
                <strong className="font-semibold text-[#2a231c]">
                  El sistema de los 4 ángeles
                </strong>{" "}
                para tomar decisiones alineadas —un marco estructurado, no
                eslogan en redes.
              </p>
            </li>
          </ul>
        </section>

        <section className="bg-[#2a231c] px-5 py-16 text-[#ebe2d6] sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-serif text-xl italic leading-relaxed text-[#dcc9a8] sm:text-2xl">
              Esto NO es motivación.
            </p>
            <p className="mt-6 text-base uppercase tracking-[0.28em] text-[#c4a574]">
              Es un sistema estructurado de reconexión personal
            </p>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-[#c9bdb0]">
              Nada de gritarte que &quot;ya casi&quot;. Un camino sobrio para
              volver a escucharte —con claridad, no con ruido.
            </p>
          </div>
        </section>

        <section className="border-t border-[#dcd0c4]/60 bg-[#f0e8de] px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#8a7560]">
              Aparta tu lugar
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-[#2a231c] sm:text-3xl">
              Da el primer paso hacia una decisión más alineada
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#5c4f42]">
              El registro es gratuito y toma menos de un minuto.
            </p>
            <a
              href="#registro"
              className="mt-8 inline-flex items-center justify-center bg-[#2a231c] px-8 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-[#f4ede4] shadow-[0_12px_32px_rgba(42,35,28,0.16)] transition hover:bg-[#3d3229] active:scale-[0.98]"
            >
              Registrarme gratis
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dcd0c4]/80 bg-[#ebe2d6]/40 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-[#8a7560] sm:flex-row sm:text-left">
          <span className="font-serif text-[#2a231c]">Rui Machalele</span>
          <span>Método de los 4 Ángeles · 2026</span>
        </div>
      </footer>

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#dcd0c4]/80 bg-[#f4ede4]/95 p-4 backdrop-blur-md hidden">
        <a
          href="#registro"
          className="flex w-full items-center justify-center bg-[#2a231c] py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#f4ede4]"
        >
          Reserva tu lugar gratis
        </a>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify full TypeScript build**

```bash
cd /Users/noeli/Documents/Develop/rui && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Verify dev server starts without errors**

```bash
cd /Users/noeli/Documents/Develop/rui && npm run dev 2>&1 | head -20
```

Expected: `Ready` message, no compilation errors.

- [ ] **Step 4: Commit**

```bash
git add app/webinar/page.tsx
git commit -m "feat: replace webinar iframe with native WebinarForm component"
```
