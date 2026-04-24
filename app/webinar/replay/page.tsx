import type { Metadata } from "next";

const replayVideoId = process.env.NEXT_PUBLIC_WEBINAR_REPLAY_VIDEO_ID;
const replayEmbedUrl = process.env.NEXT_PUBLIC_WEBINAR_REPLAY_EMBED_URL;

export const metadata: Metadata = {
  title: "Replay disponible | Rui Machalele",
  description:
    "Replay por tiempo limitado del webinar del Método de los 4 Ángeles.",
  robots: { index: false, follow: false },
};

function ReplayVideo() {
  const src =
    replayEmbedUrl ||
    (replayVideoId ? `https://www.youtube.com/embed/${replayVideoId}?rel=0` : "");

  if (!src) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center border border-[#d8c8b2] bg-[#1b1510] px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#c4a574]/50 text-[#c4a574]">
          <svg className="ml-1 h-9 w-9" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-[#c9bdb0]">
          Configura{" "}
          <code className="rounded bg-[#2a231c] px-1.5 py-0.5 text-xs text-[#dcc9a8]">
            NEXT_PUBLIC_WEBINAR_REPLAY_VIDEO_ID
          </code>{" "}
          o{" "}
          <code className="rounded bg-[#2a231c] px-1.5 py-0.5 text-xs text-[#dcc9a8]">
            NEXT_PUBLIC_WEBINAR_REPLAY_EMBED_URL
          </code>{" "}
          para activar el replay.
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden border border-[#d8c8b2] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <iframe
        title="Replay del webinar Rui Machalele"
        className="h-full w-full"
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export default function WebinarReplayPage() {
  return (
    <main className="min-h-screen bg-[#f4ede4] text-[#2a231c]">
      <section className="relative overflow-hidden border-b border-[#d8c8b2] bg-[#1b1510] px-5 py-16 text-[#f4ede4] sm:px-8 sm:py-20">
        <div
          className="pointer-events-none absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#c4a574]/20 blur-[90px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#c4a574]">
            Replay disponible
          </p>
          <h1 className="mt-6 font-serif text-[2rem] font-semibold leading-tight sm:text-5xl sm:leading-tight">
            Si no estuviste en vivo… probablemente sigues en el mismo lugar
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#dcc9a8] sm:text-xl">
            Esto no es contenido gratuito
            <br />
            <span className="text-[#f4ede4]">Es una intervención</span>
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <a
              href="#replay"
              className="inline-flex min-w-[220px] items-center justify-center bg-[#c4a574] px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#1b1510] transition hover:bg-[#d4b896]"
            >
              Ver ahora
            </a>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#e3d4bf]">
              Disponible solo por tiempo limitado
            </p>
          </div>
        </div>
      </section>

      <section id="replay" className="scroll-mt-8 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 border-l-2 border-[#9a7b45] pl-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a7b45]">
                Mira con atención
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-[#2a231c] sm:text-3xl">
                Replay del webinar
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#6c5b4a]">
              No lo pongas de fondo. Si algo te confronta, pausa y escríbelo.
            </p>
          </div>

          <ReplayVideo />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Mira el video completo hoy, no cuando tengas tiempo.",
              "Identifica la frase que más te incomoda.",
              "Decide si vas a seguir igual o vas a tomar acción.",
            ].map((item) => (
              <div key={item} className="border border-[#d8c8b2] bg-[#faf6f1] p-5">
                <p className="text-sm leading-relaxed text-[#4f4236]">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="#replay"
              className="inline-flex min-w-[220px] items-center justify-center bg-[#2a231c] px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f4ede4] transition hover:bg-[#3d3229]"
            >
              Ver ahora
            </a>
            <p className="mt-4 text-sm text-[#8a7560]">
              Este video estará disponible solo por tiempo limitado.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
