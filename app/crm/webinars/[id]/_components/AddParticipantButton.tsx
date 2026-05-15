'use client'

import { useState, useRef, useEffect } from 'react'
import { addRegistration, createAndRegister } from '../../actions'
import { TOK } from '@/app/crm/_lib/ui-tokens'

interface ContactOption {
  id: number
  name: string
  email: string
}

interface Props {
  webinarId: number
  registeredContactIds: number[]
}

export function AddParticipantButton({ webinarId, registeredContactIds }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ContactOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      return
    }

    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/crm/contacts-search?q=${encodeURIComponent(query)}`,
        )
        if (res.ok) {
          const data = (await res.json()) as ContactOption[]
          setResults(data)
          setShowDropdown(data.length > 0)
        }
      } catch {
        // ignore network errors silently
      }
    }, 300)

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [query])

  async function handleSelect(contact: ContactOption) {
    if (registeredContactIds.includes(contact.id)) return
    setLoading(true)
    setError(null)
    const result = await addRegistration(webinarId, contact.id)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      handleClose()
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !newEmail.trim()) return
    setLoading(true)
    setError(null)
    const result = await createAndRegister(webinarId, newName.trim(), newEmail.trim())
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      handleClose()
    }
  }

  function handleClose() {
    setOpen(false)
    setMode('search')
    setQuery('')
    setResults([])
    setShowDropdown(false)
    setNewName('')
    setNewEmail('')
    setError(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-on-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-surface-container-lowest)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-fixed)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        Agregar contacto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4">
          <div
            className="w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--shadow-md)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-participant-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="add-participant-title" className="text-base font-semibold text-[var(--color-on-surface)]">
                Agregar participante
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="rounded-full bg-[var(--color-surface-container-high)] p-1.5 text-[var(--color-on-surface-variant)] transition hover:bg-[var(--color-surface-container-highest)] hover:text-[var(--color-on-surface)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {mode === 'search' ? (
              <>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      if (!e.target.value.trim()) {
                        setResults([])
                        setShowDropdown(false)
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder="Buscar por nombre o email..."
                    autoFocus
                    className={TOK.inputCompact}
                  />
                  {showDropdown && (
                    <ul className="absolute z-10 mt-1 w-full rounded-[var(--radius-md)] bg-[var(--color-surface-container-lowest)] p-1 shadow-[var(--shadow-sm)]">
                      {results.map((c) => {
                        const alreadyAdded = registeredContactIds.includes(c.id)
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              disabled={alreadyAdded || loading}
                              onMouseDown={() => handleSelect(c)}
                              className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition hover:bg-[var(--color-surface-container)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <span className="font-medium text-[var(--color-on-surface)]">{c.name}</span>
                              <span className="ml-2 text-xs text-[var(--color-on-surface-variant)]">{c.email}</span>
                              {alreadyAdded && (
                                <span className="ml-2 text-xs text-[var(--color-primary)]">ya registrado</span>
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="mt-3 text-sm text-[var(--color-primary)] hover:underline"
                >
                  ¿No está en la lista? Crear nuevo contacto
                </button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre completo"
                    autoFocus
                    className={TOK.inputCompact}
                  />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className={TOK.inputCompact}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className="mt-2 text-sm text-[var(--color-on-surface-variant)] hover:underline"
                >
                  ← Volver a buscar
                </button>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className={TOK.actionSecondary}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={loading || !newName.trim() || !newEmail.trim()}
                    className="rounded-lg bg-[var(--color-on-surface)] px-4 py-2 text-sm font-medium text-[var(--color-surface-container-lowest)] transition hover:opacity-90 disabled:opacity-60"
                  >
                    {loading ? 'Creando...' : 'Crear y agregar'}
                  </button>
                </div>
              </>
            )}

            {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}
