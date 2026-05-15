import { SegmentForm } from '../_components/SegmentForm'

export default function NuevoSegmentoPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--color-on-surface)]">Nuevo segmento</h1>
      <SegmentForm />
    </div>
  )
}
