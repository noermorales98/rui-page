'use client'

const WHATSAPP_URL = "https://chat.whatsapp.com/BrFbYoHj90OLjCRNXD3EFo?mode=gi_t"

export function WhatsAppButton() {
  function handleClick() {
    fetch('/api/webinar/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'WHATSAPP_CLICK' }),
    }).catch(() => {})
  }

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="mt-4 inline-flex bg-[#25D366] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#128C7E]"
    >
      Entrar al grupo
    </a>
  )
}
