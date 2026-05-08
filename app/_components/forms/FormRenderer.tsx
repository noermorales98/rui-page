'use client'

import { useActionState } from 'react'
import type { CrmFormFieldType } from '@prisma/client'
import { CustomDateInput, CustomDateTimeInput, CustomTimeInput } from './CustomTemporalInputs'

export type RenderField = {
  id: number
  fieldKey: string
  type: CrmFormFieldType
  label: string
  placeholder: string | null
  helpText: string | null
  isRequired: boolean
}

export type PublicFormState = {
  error?: string
  success?: boolean
  message?: string
} | null

type PublicFormAction = (
  prevState: PublicFormState,
  formData: FormData,
) => Promise<PublicFormState>

interface Props {
  title: string
  description: string | null
  fields: RenderField[]
  submitLabel: string
  successMessage: string
  action: PublicFormAction
}

export function FormRenderer({
  title,
  description,
  fields,
  submitLabel,
  successMessage,
  action,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, null)

  if (state?.success) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center border border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-4 text-gray-600">{state.message || successMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>}
      </div>

      <form action={formAction} className="space-y-5">
        {fields.map((field) => (
          <FieldControl key={field.id} field={field} />
        ))}

        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? 'Enviando...' : submitLabel}
        </button>
      </form>
    </div>
  )
}

function FieldControl({ field }: { field: RenderField }) {
  const commonClass =
    'w-full rounded-lg border border-[#f2f2f2] px-3 py-2 text-sm focus:border-[#9ca3af] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#9bbdf7]'

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {field.label}
        {field.isRequired && <span className="text-red-500"> *</span>}
      </label>

      {field.type === 'CUSTOM_DATE' ? (
        <CustomDateInput
          name={field.fieldKey}
          label={field.label}
          required={field.isRequired}
          placeholder={field.placeholder}
        />
      ) : field.type === 'CUSTOM_TIME' ? (
        <CustomTimeInput
          name={field.fieldKey}
          label={field.label}
          required={field.isRequired}
          placeholder={field.placeholder}
        />
      ) : field.type === 'CUSTOM_DATETIME' ? (
        <CustomDateTimeInput
          name={field.fieldKey}
          label={field.label}
          required={field.isRequired}
          placeholder={field.placeholder}
        />
      ) : (
        <input
          name={field.fieldKey}
          type={field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' || field.type === 'PHONE_WITH_COUNTRY' ? 'tel' : 'text'}
          required={field.isRequired}
          placeholder={field.placeholder ?? undefined}
          className={commonClass}
        />
      )}

      {field.helpText && <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>}
    </div>
  )
}
