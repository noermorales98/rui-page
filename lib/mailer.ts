import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

export function getDefaultFromAddress() {
  return process.env.SMTP_FROM || '"Rui CRM" <no-reply@example.com>'
}

export function getCampaignFrom(fromName?: string | null, fromEmail?: string | null) {
  if (!fromEmail) return getDefaultFromAddress()
  return fromName ? `"${fromName.replace(/"/g, '\\"')}" <${fromEmail}>` : fromEmail
}

export function getMissingSmtpConfig() {
  return ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((key) => !process.env[key])
}

export function getMailerTransporter() {
  const missing = getMissingSmtpConfig()
  if (missing.length > 0) {
    throw new Error(`Faltan variables SMTP: ${missing.join(', ')}`)
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  return transporter
}
