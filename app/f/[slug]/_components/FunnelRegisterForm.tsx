'use client'

import { useState } from 'react'
import type React from 'react'
import type { FunnelTheme } from '@/lib/funnels/types'

export function FunnelRegisterForm({ slug, theme }: { slug: string; theme: FunnelTheme }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const form = event.currentTarget
    const formData = new FormData(form)
    const res = await fetch(`/api/funnels/${slug}/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
      }),
      headers: { 'content-type': 'application/json' },
    })
    const data = await res.json()
    setPending(false)
    if (!res.ok || !data.ok) {
      setError(data.error ?? 'No pudimos registrar tus datos.')
      return
    }
    window.location.href = data.redirectUrl
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
      <label style={{ display: 'grid', gap: '.35rem', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.16em' }}>
        Nombre
        <input name="name" required style={inputStyle(theme)} />
      </label>
      <label style={{ display: 'grid', gap: '.35rem', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.16em' }}>
        Correo
        <input name="email" type="email" required style={inputStyle(theme)} />
      </label>
      <label style={{ display: 'grid', gap: '.35rem', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.16em' }}>
        Telefono
        <input name="phone" type="tel" style={inputStyle(theme)} />
      </label>
      {error && <p style={{ color: '#b42318', fontSize: 14 }}>{error}</p>}
      <button
        type="submit"
        disabled={pending}
        style={{
          border: `1px solid ${theme.accentColor}`,
          background: theme.accentColor,
          color: theme.backgroundColor,
          padding: '1rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.14em',
          cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? 'Enviando...' : 'Reservar mi lugar'}
      </button>
    </form>
  )
}

function inputStyle(theme: FunnelTheme): React.CSSProperties {
  return {
    minHeight: 44,
    border: `1px solid ${theme.accentColor}55`,
    background: '#fff',
    color: theme.textColor,
    padding: '0 .9rem',
    fontSize: 16,
  }
}
