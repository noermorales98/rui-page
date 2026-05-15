type CampaignEmailContact = {
  name: string | null
  email: string
  phone: string | null
  projectName?: string | null
}

type RenderCampaignEmailInput = {
  subject: string
  previewText?: string | null
  bodyText: string
  contact: CampaignEmailContact
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function replacePlaceholders(value: string, contact: CampaignEmailContact) {
  const replacements: Record<string, string> = {
    nombre: contact.name || contact.email,
    name: contact.name || contact.email,
    correo: contact.email,
    email: contact.email,
    telefono: contact.phone || '',
    phone: contact.phone || '',
    proyecto: contact.projectName || '',
    project: contact.projectName || '',
  }

  return value.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_match, key: string) => {
    return replacements[key.toLowerCase()] ?? ''
  })
}

function bodyTextToHtml(text: string, previewText?: string | null) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px;">${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')

  const preheader = previewText
    ? `<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(previewText)}</span>`
    : ''

  return `${preheader}<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1d1c17;max-width:640px;">${paragraphs}</div>`
}

export function renderCampaignEmail(input: RenderCampaignEmailInput) {
  const subject = replacePlaceholders(input.subject, input.contact)
  const previewText = input.previewText ? replacePlaceholders(input.previewText, input.contact) : null
  const text = replacePlaceholders(input.bodyText, input.contact)

  return {
    subject,
    text,
    html: bodyTextToHtml(text, previewText),
  }
}
