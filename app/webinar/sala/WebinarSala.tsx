"use client";

import { FormEvent, useState } from "react";

export function WebinarSala() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setJoined(true);
  }

  if (!joined) {
    return (
      <div className="flex flex-1 items-center justify-center px-5">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c4a574]">
              Antes de entrar
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[#f8f1e7]">
              ¿Con qué nombre quieres aparecer?
            </h2>
          </div>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border border-[#2d3748] bg-[#111827] px-4 py-3 text-sm text-[#f8f1e7] outline-none placeholder:text-[#697386] focus:border-[#c4a574]/70"
            />
            <button
              type="submit"
              className="w-full bg-[#c4a574] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#111827] transition hover:bg-[#d4b896]"
            >
              Entrar al webinar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1">
      <iframe
        src={`/api/zoom/webinar-room?name=${encodeURIComponent(name.trim())}`}
        className="h-full w-full border-none"
        allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-write"
        allowFullScreen
        title="Webinar Rui Machalele"
      />
    </div>
  );
}
