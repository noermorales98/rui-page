'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Video, Copy, Check, Maximize } from 'lucide-react'

interface Props {
  meetingId: number
  topic: string
  password?: string | null
  joinUrl: string
  contactName?: string | null
  returnHref: string
}

export function ZoomRoom({ meetingId, topic, password, joinUrl, contactName, returnHref }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [copied, setCopied] = useState(false)

  // Hide sidebar and navbar while in the meeting room
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'zoom-sala-overrides'
    style.textContent = `
      #crm-sidebar { display: none !important; }
      #crm-navbar  { display: none !important; }
      #crm-main    { padding-right: 0 !important; }
      #crm-main > main { gap: 0 !important; }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  async function copyLink() {
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function goFullscreen() {
    iframeRef.current?.requestFullscreen()
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 py-2.5">
        <Link
          href={returnHref}
          className="flex items-center gap-1.5 text-sm text-[var(--color-on-surface-variant)] transition hover:text-[var(--color-on-surface)]"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          {contactName ?? 'Contactos'}
        </Link>
        <div className="mx-1 h-4 w-px bg-[var(--color-outline-variant)]" />
        <Video size={15} strokeWidth={2} className="text-[#2D8CFF]" />
        <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-on-surface)]">
          {topic}
        </span>
        {password && (
          <span className="shrink-0 text-xs text-[var(--color-on-surface-variant)]">
            Clave: <span className="font-mono">{password}</span>
          </span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-on-surface-variant)] ring-1 ring-[var(--color-outline-variant)] transition hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
          >
            {copied ? (
              <Check size={13} strokeWidth={2.5} className="text-green-600" />
            ) : (
              <Copy size={13} strokeWidth={2} />
            )}
            {copied ? 'Copiado' : 'Compartir enlace'}
          </button>
          <button
            onClick={goFullscreen}
            title="Pantalla completa"
            className="flex items-center justify-center rounded-md p-1.5 text-[var(--color-on-surface-variant)] ring-1 ring-[var(--color-outline-variant)] transition hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]"
          >
            <Maximize size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Zoom iframe */}
      <div className="min-h-0 flex-1">
        <iframe
          ref={iframeRef}
          src={`/api/zoom/room/${meetingId}`}
          className="h-full w-full border-none"
          allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-write"
          allowFullScreen
          title="Zoom Meeting"
        />
      </div>
    </div>
  )
}
