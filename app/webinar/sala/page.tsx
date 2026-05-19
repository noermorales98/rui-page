import type { Metadata } from "next";
import { WebinarRoomTracker } from "./WebinarRoomTracker";
import { WebinarSala } from "./WebinarSala";

export const metadata: Metadata = {
  title: "Webinar en vivo | Rui Machalele",
  description: "Sala del webinar del Método de los 4 Ángeles.",
  robots: { index: false, follow: false },
};

export default function WebinarRoomPage() {
  return (
    <div className="flex h-dvh flex-col bg-[#0b1120] text-[#f8f1e7]">
      <WebinarRoomTracker />

      {/* Header */}
      <header className="shrink-0 border-b border-[#2d3748] bg-[#0b1120]/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-7xl flex-col justify-center gap-1 px-5 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c4a574]">
              Masterclass en vivo
            </p>
            <p className="mt-0.5 text-sm text-[#8a94a8]">
              Método de los 4 Ángeles · Rui Machalele
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 border border-[#c4a574]/25 bg-[#c4a574]/10 px-4 py-1.5 text-xs text-[#dcc9a8]">
            <span className="h-2 w-2 rounded-full bg-[#c4a574]" aria-hidden />
            Quédate hasta el final
          </div>
        </div>
      </header>

      {/* Full Zoom meeting */}
      <WebinarSala />
    </div>
  );
}
