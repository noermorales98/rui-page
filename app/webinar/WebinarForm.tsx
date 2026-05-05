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
