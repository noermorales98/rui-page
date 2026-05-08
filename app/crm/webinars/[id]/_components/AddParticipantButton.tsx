'use client'

import { useState, useRef, useEffect } from 'react'
import { addRegistration, createAndRegister } from '../../actions'

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
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        Agregar contacto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-participant-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="add-participant-title" className="text-base font-semibold text-gray-900">
                Agregar participante
              </h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                  {showDropdown && (
                    <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {results.map((c) => {
                        const alreadyAdded = registeredContactIds.includes(c.id)
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              disabled={alreadyAdded || loading}
                              onMouseDown={() => handleSelect(c)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <span className="font-medium text-gray-900">{c.name}</span>
                              <span className="ml-2 text-xs text-gray-400">{c.email}</span>
                              {alreadyAdded && (
                                <span className="ml-2 text-xs text-indigo-400">ya registrado</span>
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
                  className="mt-3 text-sm text-indigo-600 hover:underline"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMode('search')}
                  className="mt-2 text-sm text-gray-500 hover:underline"
                >
                  ← Volver a buscar
                </button>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={loading || !newName.trim() || !newEmail.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {loading ? 'Creando...' : 'Crear y agregar'}
                  </button>
                </div>
              </>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}
