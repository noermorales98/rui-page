import Link from "next/link";
import { handleWebinarSubmission } from "../actions";

function SilhouetteArt() {
  return (
    <svg
      viewBox="0 0 420 380"
      className="w-full h-auto max-w-[min(100%,420px)] mx-auto drop-shadow-[0_24px_48px_rgba(42,35,28,0.12)]"
      aria-hidden
    >
      <defs>
        <linearGradient id="sil-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4b896" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#9a7b45" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#5c4f42" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="sil-mist" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ebe2d6" stopOpacity="0" />
          <stop offset="100%" stopColor="#ebe2d6" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      <ellipse cx="210" cy="340" rx="175" ry="28" fill="url(#sil-mist)" />
      <g fill="url(#sil-gold)" opacity="0.92">
        <path d="M28 310c0-42 15-82 24-108 9-26 21-39 36-39s27 13 36 39c9 26 24 66 24 108H28z" />
        <circle cx="88" cy="134" r="31" />
        <path d="M112 310c0-48 18-92 28-120 10-28 22-42 38-42s28 14 38 42c10 28 28 72 28 120H112z" />
        <circle cx="178" cy="118" r="36" />
        <path d="M202 310c0-52 20-98 32-128 12-30 26-46 44-46s32 16 44 46c12 30 32 76 32 128H202z" />
        <circle cx="278" cy="108" r="40" />
        <path d="M304 310c0-44 16-86 26-114 10-28 24-44 40-44s30 16 40 44c10 28 26 70 26 114H304z" />
        <circle cx="370" cy="124" r="34" />
      </g>
      <path
        d="M210 48c-18 0-32 14-32 32s14 32 32 32 32-14 32-32-14-32-32-32zm0 8c13 0 24 11 24 24s-11 24-24 24-24-11-24-24 11-24 24-24z"
        fill="none"
        stroke="#c4a574"
        strokeWidth="1.2"
        opacity="0.45"
      />
    </svg>
  );
}

export default function WebinarLandingPage() {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#dcd0c4]/60 bg-[#f4ede4]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
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

      <main className="bg-[#f4ede4] text-[#2a231c] pt-16 pb-24 sm:pb-0">
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#dcc9a8]/35 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-[#c4a574]/20 blur-3xl"
            aria-hidden
          />

          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
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
                  className="inline-flex items-center justify-center bg-[#2a231c] px-8 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-[#f4ede4] shadow-[0_12px_32px_rgba(42,35,28,0.2)] transition hover:bg-[#3d3229] active:scale-[0.98]"
                >
                  Reserva tu lugar gratis
                </a>
                <p className="max-w-[200px] text-sm leading-snug text-[#8a7560]">
                  Para profesionales y emprendedores
                </p>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                <SilhouetteArt />
                <p className="mt-6 text-center font-serif text-sm italic text-[#7a6a5a] lg:text-left">
                  De la desconexión → a la alineación con propósito
                </p>
              </div>
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

        <section
          id="registro"
          className="scroll-mt-24 border-t border-[#dcd0c4]/60 bg-[#f0e8de] px-5 py-24 sm:px-8"
        >
          <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-2 lg:items-start">
            <div className="space-y-6">
              <h2 className="font-serif text-3xl font-semibold leading-tight text-[#2a231c]">
                Un espacio de 60 minutos para mirar hacia adentro con rigor
              </h2>
              <p className="text-lg leading-relaxed text-[#5c4f42]">
                Déjanos tu nombre y tu mejor correo. Te enviaremos el acceso al
                webinar y lo que necesites para prepararte sin prisa, sin
                ruido.
              </p>
              <p className="text-sm leading-relaxed text-[#8a7560]">
                Contenido universal de autoconocimiento. No es formación
                religiosa ni dogmática.
              </p>
            </div>

            <div className="border border-[#dcd0c4] bg-[#faf6f1]/90 p-8 shadow-[0_20px_50px_rgba(42,35,28,0.08)] sm:p-10">
              <form action={handleWebinarSubmission} className="space-y-7">
                <div>
                  <label
                    htmlFor="webinar-name"
                    className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7560]"
                  >
                    Nombre
                  </label>
                  <input
                    id="webinar-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Cómo te gusta que te llamen"
                    className="mt-2 w-full border-0 border-b border-[#c4b8a8] bg-transparent py-2.5 text-[#2a231c] outline-none ring-0 placeholder:text-[#a89888] focus:border-[#9a7b45]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="webinar-email"
                    className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7560]"
                  >
                    Email
                  </label>
                  <input
                    id="webinar-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="tu@email.com"
                    className="mt-2 w-full border-0 border-b border-[#c4b8a8] bg-transparent py-2.5 text-[#2a231c] outline-none ring-0 placeholder:text-[#a89888] focus:border-[#9a7b45]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="webinar-phone"
                    className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a7560]"
                  >
                    Teléfono
                  </label>
                  <input
                    id="webinar-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="123 456 7890"
                    className="mt-2 w-full border-0 border-b border-[#c4b8a8] bg-transparent py-2.5 text-[#2a231c] outline-none ring-0 placeholder:text-[#a89888] focus:border-[#9a7b45]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#9a7b45] py-4 text-center text-[13px] font-semibold uppercase tracking-[0.2em] text-[#faf6f1] transition hover:bg-[#8a6b3a] active:scale-[0.99]"
                >
                  Reserva tu lugar gratis
                </button>
                <p className="text-center text-xs leading-relaxed text-[#8a7560]">
                  Al registrarte aceptas recibir comunicación sobre este evento.
                  Puedes darte de baja cuando quieras.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dcd0c4]/80 bg-[#ebe2d6]/40 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-sm text-[#8a7560] sm:flex-row sm:text-left">
          <span className="font-serif text-[#2a231c]">Rui Machalele</span>
          <span>Método de los 4 Ángeles · 2026</span>
        </div>
      </footer>

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#dcd0c4]/80 bg-[#f4ede4]/95 p-4 backdrop-blur-md sm:hidden">
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
