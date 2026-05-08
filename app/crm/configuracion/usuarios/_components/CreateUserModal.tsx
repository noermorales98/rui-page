'use client'

import { Plus } from 'lucide-react'
import { useState, useActionState, useEffect } from 'react'
import { createUser } from '../actions'
import { Button, Input, ModalWrapper } from '@/app/crm/_components/ui'

const fieldClass = 'bg-[#f7f8fa]'
const selectClass = 'min-h-10 w-full rounded-full border border-[#f2f2f2] bg-[#f7f8fa] px-5 py-2.5 text-sm text-[#080808] outline-none transition focus:border-[#9ca3af] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bbdf7]'

export function CreateUserModal() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createUser, null)

  // Track whether form was submitted at least once
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (state === null && submitted && !isPending) {
      const id = window.setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [isPending, state, submitted])

  function handleClose() {
    setOpen(false)
    setSubmitted(false)
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
      >
        <Plus size={16} strokeWidth={2} />
        Nuevo usuario
      </Button>

      {open && (
        <ModalWrapper onClose={handleClose} title="Nuevo usuario">
            {state?.error && (
              <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            <form
              key={open ? 'open' : 'closed'}
              action={(formData) => {
                setSubmitted(true)
                formAction(formData)
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]"
                >
                  Nombre
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  className={fieldClass}
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={fieldClass}
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]"
                >
                  Contraseña
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className={fieldClass}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]"
                >
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="EDITOR"
                  className={selectClass}
                >
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="secondary"
                  fullWidth
                  size="lg"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  fullWidth
                  size="lg"
                >
                  {isPending ? 'Creando...' : 'Crear usuario'}
                </Button>
              </div>
            </form>
        </ModalWrapper>
      )}
    </>
  )
}
