'use client'

import { useActionState, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { createForm } from '../actions'
import { slugify } from '../_lib/field-types'
import { Button, Input, ModalWrapper } from '@/app/crm/_components/ui'
import { TOK } from '@/app/crm/_lib/ui-tokens'

export function CreateFormModal() {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [slug, setSlug] = useState('')
  const [state, formAction, isPending] = useActionState(createForm, null)

  useEffect(() => {
    if (submitted && !isPending && state === null) {
      const id = window.setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setName('')
        setSlug('')
        setSlugTouched(false)
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
        Nuevo formulario
      </Button>

      {open && (
        <ModalWrapper onClose={handleClose} title="Nuevo formulario">
            {state?.error && <div className={`${TOK.errorBox}`}>{state.error}</div>}

            <form action={formAction} onSubmit={() => setSubmitted(true)} className="space-y-4">
              <div>
                <label className={TOK.label}>
                  Nombre <span className="text-[var(--color-error)]">*</span>
                </label>
                <Input
                  name="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (!slugTouched) setSlug(slugify(event.target.value))
                  }}
                  required
                  minLength={2}
                  placeholder="Registro webinar de mayo"
                  className={TOK.fieldBg}
                />
              </div>

              <div>
                <label className={TOK.label}>
                  Slug publico <span className="text-[var(--color-error)]">*</span>
                </label>
                <Input
                  name="slug"
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    setSlug(slugify(event.target.value))
                  }}
                  required
                  minLength={2}
                  placeholder="registro_webinar_mayo"
                  className={`font-mono ${TOK.fieldBg}`}
                />
              </div>

              <div>
                <label className={TOK.label}>Descripcion</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Texto breve para orientar al visitante."
                  className={TOK.inputNativeMultiline}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={TOK.label}>Boton</label>
                  <Input
                    name="submitLabel"
                    defaultValue="Enviar"
                    className={TOK.fieldBg}
                  />
                </div>
                <div>
                  <label className={TOK.label}>Mensaje final</label>
                  <Input
                    name="successMessage"
                    defaultValue="Gracias, recibimos tus datos."
                    className={TOK.fieldBg}
                  />
                </div>
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
                  {isPending ? 'Creando...' : 'Crear formulario'}
                </Button>
              </div>
            </form>
        </ModalWrapper>
      )}
    </>
  )
}
