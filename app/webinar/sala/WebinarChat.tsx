"use client";

import { FormEvent, useState } from "react";

type Message = {
  author: string;
  text: string;
  tone?: "host" | "guest";
};

const initialMessages: Message[] = [
  {
    author: "Equipo Rui",
    text: "Bienvenido. Antes de escribir, respira y escucha la primera parte completa.",
    tone: "host",
  },
  {
    author: "María",
    text: "Estoy aquí porque logré estabilidad, pero no logro sentir dirección.",
  },
  {
    author: "Carlos",
    text: "Me pega lo de sentirme desconectado aunque afuera todo parezca bien.",
  },
];

export default function WebinarChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setMessages((current) => [...current, { author: "Tú", text }]);
    setDraft("");
  };

  return (
    <aside className="flex h-full min-h-[420px] flex-col border border-[#2d3748] bg-[#0f172a]/85 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="border-b border-[#2d3748] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c4a574]">
          Interacción en vivo
        </p>
        <h2 className="mt-1 font-serif text-xl text-[#f8f1e7]">
          Comparte lo que estás viendo
        </h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((message, index) => (
          <div
            key={`${message.author}-${index}`}
            className={`rounded-sm border p-4 ${
              message.tone === "host"
                ? "border-[#c4a574]/35 bg-[#c4a574]/10"
                : "border-[#2d3748] bg-[#111827]"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9bdb0]">
              {message.author}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#e7dbcc]">
              {message.text}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[#2d3748] p-4">
        <label htmlFor="chat-message" className="sr-only">
          Escribe tu reflexión
        </label>
        <textarea
          id="chat-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="¿Qué estás descubriendo sobre ti?"
          className="w-full resize-none border border-[#2d3748] bg-[#0b1120] px-4 py-3 text-sm text-[#f8f1e7] outline-none placeholder:text-[#697386] focus:border-[#c4a574]/70"
        />
        <button
          type="submit"
          className="mt-3 w-full bg-[#c4a574] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#111827] transition hover:bg-[#d4b896]"
        >
          Enviar reflexión
        </button>
      </form>
    </aside>
  );
}
