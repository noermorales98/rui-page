import type { FunnelBlock } from './types'

export type BlockValidationError = { blockId: string; message: string }

const VIDEO_URL_RE = /youtube\.com|vimeo\.com|\.mp4|\.webm/

export function validateBlocks(blocks: FunnelBlock[]): BlockValidationError[] {
  const errors: BlockValidationError[] = []
  for (const block of blocks) {
    const cfg = block.config
    if (block.type === 'HERO' && !cfg.title) {
      errors.push({ blockId: block.id, message: 'El título es obligatorio' })
    }
    if (block.type === 'VIDEO') {
      const url = typeof cfg.url === 'string' ? cfg.url : ''
      if (!url || !VIDEO_URL_RE.test(url)) {
        errors.push({ blockId: block.id, message: 'URL de video inválida (usa YouTube, Vimeo, .mp4 o .webm)' })
      }
    }
    if (block.type === 'CTA') {
      if (!cfg.buttonText) errors.push({ blockId: block.id, message: 'El texto del botón es obligatorio' })
      if (!cfg.href) errors.push({ blockId: block.id, message: 'El link del botón es obligatorio' })
    }
    if (block.type === 'CUSTOM_HTML' && !cfg.html) {
      errors.push({ blockId: block.id, message: 'El HTML no puede estar vacío' })
    }
    if (block.type === 'FORM' && !cfg.formId) {
      errors.push({ blockId: block.id, message: 'Debes seleccionar un formulario' })
    }
  }
  return errors
}

export function isInvalidBlock(blockId: string, errors: BlockValidationError[]): boolean {
  return errors.some((e) => e.blockId === blockId)
}
