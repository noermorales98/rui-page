'use client'

import { useState } from 'react'

const SALA_URL = '/webinar/sala'

function trackAcceso(name: string) {
  fetch('/api/webinar/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'ACCESO_ENTRY', meta: { name } }),
  }).catch(() => {})
}

export function AccesoGate() {
  const [phase, setPhase] = useState<'gate' | 'content'>('gate')
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    trackAcceso(trimmed)
    setPhase('content')
  }

  if (phase === 'gate') {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#15110d] text-[#f4ede4] flex items-center justify-center">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#9a7b45]/20 blur-[120px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-sm px-5 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#c4a574]">
            Antesala del webinar
          </p>
          <h1 className="mt-6 font-serif text-2xl font-semibold leading-tight text-[#f4ede4] sm:text-3xl">
            Antes de entrar, ¿cómo te llamas?
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#c9bdb0]">
            Para saber quién asistió al evento.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              autoFocus
              className="w-full border border-[#c4a574]/30 bg-[#211a14] px-4 py-3 text-base text-[#f4ede4] placeholder:text-[#8a7560] focus:border-[#c4a574] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full border border-[#c4a574] bg-[#c4a574] px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#15110d] transition hover:bg-[#d4b896] disabled:opacity-40"
            >
              Continuar
            </button>
          </form>
        </div>
      </main>
    )
  }

  // Content phase — show the original acceso page content
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#15110d] text-[#f4ede4]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#9a7b45]/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-180px] right-[-120px] h-[420px] w-[420px] rounded-full bg-[#3d3229]/80 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.42)_72%)]"
        aria-hidden
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-[#c4a574]">
          Antesala del webinar
        </p>

        <div className="mt-10 h-px w-20 bg-[#c4a574]/50" />

        <h1 className="mt-10 max-w-2xl font-serif text-[2rem] font-semibold leading-tight text-[#f4ede4] sm:text-5xl sm:leading-tight">
          Estás a punto de entrar a una experiencia diferente
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#c9bdb0] sm:text-xl">
          Esto no es contenido para entretenerte
          <br />
          <span className="text-[#f4ede4]">Es un espacio para confrontarte</span>
        </p>

        <div className="mt-12 w-full max-w-xl border border-[#c4a574]/20 bg-[#211a14]/70 p-6 text-left shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-8">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#9a7b45]">
            Reglas de entrada
          </p>
          <ul className="mt-7 space-y-5">
            {[
              'No tomes esto a la ligera',
              'Puede incomodarte',
              'Si te quedas hasta el final, algo va a cambiar',
            ].map((rule) => (
              <li key={rule} className="flex gap-4 text-[#e7dbcc]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4a574]" aria-hidden />
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <a
          href={SALA_URL}
          className="mt-12 inline-flex min-w-[260px] items-center justify-center border border-[#c4a574] bg-[#c4a574] px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#15110d] transition hover:bg-[#d4b896]"
        >
          Entrar al webinar
        </a>
      </section>
    </main>
  )
}
