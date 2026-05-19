import type { Metadata } from "next";
import Link from "next/link";
import WebinarThanksClient from "./WebinarThanksClient";
import { WebinarWarmupVideo } from "./WebinarWarmupVideo";
import { WhatsAppButton } from "./WhatsAppButton";

export const metadata: Metadata = {
  title: "Tu lugar está reservado | Webinar — Rui Machalele",
  description:
    "Pasos para asegurar tu asistencia al webinar del Método de los 4 Ángeles.",
  robots: { index: false, follow: false },
};

export default function WebinarGraciasPage() {
  return (
    <div className="min-h-screen bg-[#f4ede4] text-[#2a231c]">
      <header className="border-b border-[#dcd0c4]/60 bg-[#f4ede4]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5 sm:px-8">
          <span className="font-serif text-base text-[#2a231c]">
            Rui Machalele
          </span>
          <Link
            href="/"
            className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a7560] hover:text-[#5c4f42]"
          >
            Inicio
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-2xl px-5 pb-4 pt-14 text-center sm:px-8 sm:pt-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#9a7b45]">
            Confirmación
          </p>
          <h1 className="mt-4 font-serif text-[1.65rem] font-semibold leading-tight text-[#2a231c] sm:text-4xl sm:leading-tight">
            Tu lugar está reservado… pero esto es importante
          </h1>
        </section>

        <WebinarWarmupVideo />

        <section className="mx-auto max-w-xl px-5 py-8 sm:px-8">
          <p className="text-center text-lg leading-relaxed text-[#3d3229] sm:text-xl">
            La mayoría de personas que se registran{" "}
            <span className="font-semibold text-[#2a231c]">NO asisten</span>
            …
            <br className="hidden sm:block" />
            <span className="sm:ml-1">y por eso siguen igual</span>
          </p>
          <p className="mt-8 text-center text-sm leading-relaxed text-[#8a7560]">
            Si llegaste hasta aquí, no fue por casualidad. Ahora toca
            protegerte de ti mismo: la distracción, el &quot;luego lo veo&quot;,
            el piloto automático.
          </p>
        </section>

        <section className="border-y border-[#dcd0c4]/80 bg-[#faf6f1]/80">
          <div className="mx-auto max-w-xl px-5 py-12 sm:px-8">
            <h2 className="text-center font-serif text-lg font-semibold text-[#2a231c]">
              Haz esto ahora
            </h2>
            <ol className="mt-10 space-y-8">
              <li className="flex gap-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#c4a574] font-serif text-lg text-[#8a6b3e]"
                  aria-hidden
                >
                  1
                </span>
                <div>
                  <p className="font-semibold text-[#2a231c]">
                    Entra al grupo privado de WhatsApp
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c4f42]">
                    Ahí recibirás recordatorios, el enlace de acceso y avisos
                    importantes antes de empezar.
                  </p>
                  <WhatsAppButton />
                </div>
              </li>
              <li className="flex gap-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#c4a574] font-serif text-lg text-[#8a6b3e]"
                  aria-hidden
                >
                  2
                </span>
                <div>
                  <p className="font-semibold text-[#2a231c]">
                    Agrega el evento a tu calendario
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c4f42]">
                    Si no está en el calendario, no existe. Abajo tienes Google
                    y archivo .ics.
                  </p>
                </div>
              </li>
              <li className="flex gap-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#c4a574] font-serif text-lg text-[#8a6b3e]"
                  aria-hidden
                >
                  3
                </span>
                <div>
                  <p className="font-semibold text-[#2a231c]">
                    Entra 5 minutos antes
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c4f42]">
                    Los que llegan en el último segundo suelen llegar
                    fragmentados. Tú no.
                  </p>
                </div>
              </li>
              <li className="flex gap-5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#c4a574] font-serif text-lg text-[#8a6b3e]"
                  aria-hidden
                >
                  4
                </span>
                <div>
                  <p className="font-semibold text-[#2a231c]">
                    Ven sin distracciones
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c4f42]">
                    Pantalla completa. Sin multitarea. Esta hora es un
                    contrato contigo.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <WebinarThanksClient />
      </main>

      <footer className="border-t border-[#dcd0c4]/60 px-5 py-8 text-center text-xs text-[#8a7560]">
        Revisa tu correo (y spam) por el enlace de acceso al webinar.
      </footer>
    </div>
  );
}
