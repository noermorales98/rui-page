'use client'

import type { FunnelBlock } from '@/lib/funnels/types'
import { HeroEditor }          from './editors/HeroEditor'
import { TextEditor }          from './editors/TextEditor'
import { VideoEditor }         from './editors/VideoEditor'
import { FormEditor }          from './editors/FormEditor'
import { CtaEditor }           from './editors/CtaEditor'
import { FaqEditor }           from './editors/FaqEditor'
import { TestimonialsEditor }  from './editors/TestimonialsEditor'
import { FooterEditor }        from './editors/FooterEditor'
import { CustomHtmlEditor }    from './editors/CustomHtmlEditor'

type Props = {
  block: FunnelBlock
  onUpdate: (blockId: string, newConfig: Record<string, unknown>) => void
  onDelete: (blockId: string) => void
}

const TYPE_LABELS: Record<string, string> = {
  HERO: '⬛ Hero', TEXT: '📝 Texto', VIDEO: '🎥 Video', FORM: '📋 Formulario',
  CTA: '🔘 CTA', FAQ: '❓ FAQ', TESTIMONIALS: '⭐ Testimonios',
  WEBINAR_ROOM: '📡 Sala', FOOTER: '🔗 Footer', CUSTOM_HTML: '⌨️ HTML',
}

export function BlockEditor({ block, onUpdate, onDelete }: Props) {
  const onChange = (newConfig: Record<string, unknown>) => onUpdate(block.id, newConfig)

  function renderEditor() {
    switch (block.type) {
      case 'HERO':         return <HeroEditor         config={block.config} onChange={onChange} />
      case 'TEXT':         return <TextEditor         config={block.config} onChange={onChange} />
      case 'VIDEO':        return <VideoEditor        config={block.config} onChange={onChange} />
      case 'FORM':         return <FormEditor         config={block.config} onChange={onChange} />
      case 'CTA':          return <CtaEditor          config={block.config} onChange={onChange} />
      case 'FAQ':          return <FaqEditor          config={block.config} onChange={onChange} />
      case 'TESTIMONIALS': return <TestimonialsEditor config={block.config} onChange={onChange} />
      case 'FOOTER':       return <FooterEditor       config={block.config} onChange={onChange} />
      case 'CUSTOM_HTML':  return <CustomHtmlEditor   config={block.config} onChange={onChange} />
      case 'WEBINAR_ROOM': return (
        <p className="text-sm text-[var(--color-on-surface-variant)]">
          El bloque de sala se configura automáticamente con los datos del webinar.
        </p>
      )
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
          {TYPE_LABELS[block.type] ?? block.type}
        </p>
        <button
          type="button"
          className="text-xs text-[var(--color-error)] hover:underline"
          onClick={() => onDelete(block.id)}
        >
          Eliminar
        </button>
      </div>
      {renderEditor()}
    </div>
  )
}
