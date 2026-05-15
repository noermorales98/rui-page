'use client'

import { Plus } from 'lucide-react'
import { useState, useActionState, useEffect } from 'react'
import { createUser } from '../actions'
import { CRM_USER_ROLES } from '../role-options'
import { Button, Input, ModalWrapper } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

const fieldClass = TOK.fieldBg
const selectClass = TOK.selectLg

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
              <div className={TOK.errorBox}>
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
                  className={TOK.label}
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
                  className={TOK.label}
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
                  className={TOK.label}
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
                  className={TOK.label}
                >
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="ASISTENTE"
                  className={selectClass}
                >
                  {CRM_USER_ROLES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
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
