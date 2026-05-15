import { TemplateForm } from '../_components/TemplateForm'

export default function NewTemplatePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">
        Nueva plantilla
      </h1>
      <TemplateForm />
    </div>
  )
}
