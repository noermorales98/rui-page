import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import WebinarChat from "./WebinarChat";
import { WebinarRoomTracker } from "./WebinarRoomTracker";

export const metadata: Metadata = {
  title: "Webinar en vivo | Rui Machalele",
  description:
    "Sala del webinar del Método de los 4 Ángeles: retención, revelación y preparación para la siguiente decisión.",
  robots: { index: false, follow: false },
};

function iframeSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/src=["']([^"']+)["']/i);
  return match?.[1] ?? value;
}

async function getWebinarLink(): Promise<string | null> {
  const WEBINAR_PUBLIC_ID = parseInt(process.env.WEBINAR_PUBLIC_ID ?? "1");
  try {
    const webinar = await prisma.webinar.findUnique({
      where: { id: WEBINAR_PUBLIC_ID },
      select: { link: true },
    });
    return webinar?.link ?? null;
  } catch {
    return null;
  }
}

function WebinarVideo({ src }: { src: string | null }) {
  if (!src) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center border border-[#2d3748] bg-[#0b1120] px-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#c4a574]/40 text-[#c4a574]">
          <svg className="ml-1 h-9 w-9" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-[#8a94a8]">
          El link del webinar aún no está configurado.{" "}
          <a
            href="/crm/webinars"
            className="underline text-[#c4a574]"
          >
            Configúralo en la sección de Webinars
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden border border-[#2d3748] bg-black shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
      <iframe
        title="Webinar Rui Machalele"
        className="h-full w-full"
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default async function WebinarRoomPage() {
  const rawLink = await getWebinarLink();
  const embedSrc = iframeSrc(rawLink);

  return (
    <main className="min-h-screen bg-[#0b1120] text-[#f8f1e7]">
      <WebinarRoomTracker />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(196,165,116,0.18),transparent_58%)]"
        aria-hidden
      />

      <header className="relative z-10 border-b border-[#2d3748] bg-[#0b1120]/85 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-col justify-center gap-2 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c4a574]">
              Masterclass en vivo
            </p>
            <p className="mt-1 text-sm text-[#8a94a8]">
              Método de los 4 Ángeles · Rui Machalele
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 border border-[#c4a574]/25 bg-[#c4a574]/10 px-4 py-2 text-xs text-[#dcc9a8]">
            <span className="h-2 w-2 rounded-full bg-[#c4a574]" aria-hidden />
            Quédate hasta el final
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 max-w-4xl">
          <h1 className="font-serif text-3xl font-semibold leading-tight text-[#f8f1e7] sm:text-5xl">
            Descubre por qué te sientes perdido… aunque todo parezca estar bien
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#c9bdb0]">
            No mires esto como una clase más. Mira esto como una conversación
            incómoda con una parte de ti que lleva demasiado tiempo esperando.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="space-y-5">
            <WebinarVideo src={embedSrc} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-[#2d3748] bg-[#111827]/75 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c4a574]">
                  Recordatorio
                </p>
                <p className="mt-3 text-base leading-relaxed text-[#e7dbcc]">
                  Quédate hasta el final. Habrá algo importante para quienes no
                  quieran seguir decidiendo desde la confusión.
                </p>
              </div>
              <div className="border border-[#2d3748] bg-[#111827]/75 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c4a574]">
                  Enfoque
                </p>
                <p className="mt-3 text-base leading-relaxed text-[#e7dbcc]">
                  Apaga notificaciones. Si una frase te incomoda, no huyas:
                  escríbela.
                </p>
              </div>
            </div>

            <section className="border border-[#2d3748] bg-[#111827]/75 p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c4a574]">
                Lo que vas a ver con claridad
              </p>
              <ul className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  "Vas a entender por qué te sientes desconectado",
                  "Vas a identificar qué te está frenando",
                  "Vas a ver una nueva forma de tomar decisiones",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#d6cbbd]">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4a574]"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <WebinarChat />
        </div>
      </section>
    </main>
  );
}
