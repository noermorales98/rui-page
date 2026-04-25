import Link from "next/link";
import Script from "next/script";

function WebinarRegistrationForm() {
  return (
    <div className="w-full backdrop-blur-sm">
      <div className="w-[480px]">
        <iframe
          src="https://api.leadconnectorhq.com/widget/form/seFdzOnghjlC3grwksN7"
          style={{ width: "100%", height: "100%", border: "none", borderRadius: "0px" }}
          id="inline-seFdzOnghjlC3grwksN7"
          data-layout="{'id':'INLINE'}"
          data-trigger-type="alwaysShow"
          data-trigger-value=""
          data-activation-type="alwaysActivated"
          data-activation-value=""
          data-deactivation-type="neverDeactivate"
          data-deactivation-value=""
          data-form-name="Webinar Rui"
          data-height="531"
          data-layout-iframe-id="inline-seFdzOnghjlC3grwksN7"
          data-form-id="seFdzOnghjlC3grwksN7"
          title="Webinar Rui"
        />
      </div>
      <Script src="https://link.msgsndr.com/js/form_embed.js" />
    </div>
  );
}

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

          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:items-center lg:py-24">
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
              <WebinarRegistrationForm />
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
