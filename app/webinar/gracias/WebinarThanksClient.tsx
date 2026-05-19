"use client";

import { useCallback, useMemo, useState } from "react";

type PainOption = "claridad" | "direccion" | "motivacion";

const PAINS: { id: PainOption; label: string }[] = [
  { id: "claridad", label: "Falta de claridad" },
  { id: "direccion", label: "Falta de dirección" },
  { id: "motivacion", label: "Falta de motivación" },
];

function trackEvent(type: string, meta?: Record<string, unknown>) {
  fetch("/api/webinar/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, meta }),
  }).catch(() => {});
}

function formatGoogleCalendarDates(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return `${fmt(start)}/${fmt(end)}`;
}

function useWebinarEventBounds() {
  return useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_WEBINAR_START;
    let start: Date;
    if (raw) {
      start = new Date(raw);
      if (Number.isNaN(start.getTime())) {
        start = new Date();
        start.setDate(start.getDate() + 7);
        start.setHours(19, 0, 0, 0);
      }
    } else {
      start = new Date();
      start.setDate(start.getDate() + 7);
      start.setHours(19, 0, 0, 0);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  }, []);
}

export default function WebinarThanksClient() {
  const [pain, setPain] = useState<PainOption | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { start, end } = useWebinarEventBounds();

  const googleCalendarUrl = useMemo(() => {
    const text = encodeURIComponent(
      "Webinar · Método de los 4 Ángeles — Rui Machalele"
    );
    const details = encodeURIComponent(
      "Entra 5 minutos antes, sin distracciones. El enlace de acceso está en tu correo."
    );
    const dates = formatGoogleCalendarDates(start, end);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
  }, [start, end]);

  const downloadIcs = useCallback(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const icsDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const dtStamp = icsDate(new Date());
    const dtStart = icsDate(start);
    const dtEnd = icsDate(end);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Rui Machalele//Webinar//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:webinar-4angeles-${dtStart}@ruimachalele`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      "SUMMARY:Webinar · Método de los 4 Ángeles",
      "DESCRIPTION:Entra 5 minutos antes. Enlace en tu correo.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "webinar-metodo-4-angeles.ics";
    a.click();
    URL.revokeObjectURL(url);
  }, [start, end]);

  const handleConfirm = () => {
    if (!pain) return;
    trackEvent("PAIN_SELECTED", { pain });
    window.open(googleCalendarUrl, "_blank", "noopener,noreferrer");
    setConfirmed(true);
  };

  return (
    <>
      <section className="mx-auto max-w-xl px-5 py-10 sm:px-8">
        <h2 className="text-center font-serif text-xl font-semibold text-[#2a231c] sm:text-2xl">
          Antes de irte, responde esto
        </h2>
        <p className="mt-2 text-center text-sm text-[#8a7560]">
          Un micro-compromiso. Una línea honesta.
        </p>
        <p className="mt-6 text-center text-sm font-medium uppercase tracking-[0.2em] text-[#6b522e]">
          ¿Qué es lo que más te duele hoy?
        </p>
        <div className="mt-6 space-y-3">
          {PAINS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPain(id)}
              className={`w-full border px-5 py-4 text-left text-base transition ${
                pain === id
                  ? "border-[#2a231c] bg-[#2a231c] text-[#f4ede4]"
                  : "border-[#dcd0c4] bg-[#faf6f1] text-[#3d3229] hover:border-[#9a7b45]/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-10 space-y-4">
          <button
            type="button"
            disabled={!pain}
            onClick={handleConfirm}
            className="w-full bg-[#9a7b45] py-4 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-[#faf6f1] transition hover:bg-[#8a6b3a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar asistencia
          </button>
          {confirmed && (
            <p className="text-center text-sm text-[#5c4f42]">
              Calendario abierto. Si no se abrió, usa &quot;Agregar al calendario&quot;
              abajo.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-xl border-t border-[#dcd0c4]/80 px-5 pb-20 pt-10 sm:px-8">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-[#8a7560]">
          Agregar al calendario
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#2a231c] bg-transparent py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2a231c] transition hover:bg-[#2a231c] hover:text-[#f4ede4]"
          >
            Google Calendar
          </a>
          <button
            type="button"
            onClick={downloadIcs}
            className="border border-[#dcd0c4] bg-[#faf6f1] py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3d3229] transition hover:border-[#9a7b45]/50"
          >
            Apple / Outlook (.ics)
          </button>
        </div>
      </section>
    </>
  );
}
