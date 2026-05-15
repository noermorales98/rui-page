'use client'

import { useState } from 'react'
import type React from 'react'
import type { FunnelTheme, FormCacheEntry } from '@/lib/funnels/types'

type Props = {
  form: FormCacheEntry
  theme: FunnelTheme
}

export function CrmFormEmbed({ form, theme }: Props) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const values = Object.fromEntries(formData)
    try {
      const res = await fetch(`/api/forms/${form.slug}/submit`, {
        method: 'POST',
        body: JSON.stringify(values),
        headers: { 'content-type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'No pudimos enviar tus datos.')
        return
      }
      setDone(true)
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <p style={{ textAlign: 'center', padding: '2rem', fontSize: '1.1rem' }}>
        {form.successMessage}
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
      {form.fields.map((f) => (
        <label
          key={f.id}
          style={{ display: 'grid', gap: '.35rem', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.16em' }}
        >
          {f.label}{f.isRequired ? ' *' : ''}
          <input
            name={f.fieldKey}
            required={f.isRequired}
            placeholder={f.placeholder ?? ''}
            style={{
              minHeight: 44,
              border: `1px solid ${theme.accentColor}55`,
              background: '#fff',
              color: theme.textColor,
              padding: '0 .9rem',
              fontSize: 16,
            }}
          />
        </label>
      ))}
      {error && <p style={{ color: '#b42318', fontSize: 14, margin: 0 }}>{error}</p>}
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
        {pending ? 'Enviando...' : form.submitLabel}
      </button>
    </form>
  )
}
