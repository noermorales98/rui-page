import React from 'react'
import type { FunnelBlock, FunnelTheme, FormCacheEntry } from './types'
import { sanitizeCss, sanitizeHtml } from './sanitize'

type RenderOptions = {
  blocks: FunnelBlock[]
  theme: FunnelTheme
  registerForm?: React.ReactNode
  webinarEmbedUrl?: string | null
  webinarLink?: string | null
  formsCache?: Record<number, FormCacheEntry>
  formElements?: Record<number, React.ReactNode>
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function sectionStyle(theme: FunnelTheme): React.CSSProperties {
  return {
    background: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: theme.font === 'serif' ? 'serif' : 'sans-serif',
  }
}

function buttonStyle(theme: FunnelTheme): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.9rem 1.2rem',
    border: `1px solid ${theme.accentColor}`,
    background: theme.buttonStyle === 'outline' ? 'transparent' : theme.accentColor,
    color: theme.buttonStyle === 'outline' ? theme.accentColor : theme.backgroundColor,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: '0.75rem',
    fontWeight: 700,
    textDecoration: 'none',
  }
}

export function renderFunnelBlocks({ blocks, theme, registerForm, webinarEmbedUrl, webinarLink, formsCache, formElements }: RenderOptions) {
  return blocks.map((block) => {
    const cfg = block.config
    if (block.type === 'HERO') {
      const ctaText = asText(cfg.ctaText)
      const ctaHref = asText(cfg.ctaHref, '#')
      return React.createElement(
        'section',
        { key: block.id, style: { ...sectionStyle(theme), padding: '5rem 1.25rem' } },
        React.createElement(
          'div',
          { style: { maxWidth: 900, margin: '0 auto' } },
          React.createElement('p', { style: { color: theme.accentColor, textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: 12 } }, asText(cfg.eyebrow)),
          React.createElement('h1', { style: { fontSize: 'clamp(2rem, 6vw, 4rem)', lineHeight: 1.05, margin: '1rem 0' } }, asText(cfg.title)),
          React.createElement('p', { style: { color: theme.mutedTextColor, fontSize: '1.15rem', lineHeight: 1.7, maxWidth: 680 } }, asText(cfg.subtitle)),
          ctaText ? React.createElement('a', { href: ctaHref, style: { ...buttonStyle(theme), marginTop: '2rem' } }, ctaText) : null,
        ),
      )
    }

    if (block.type === 'FORM') {
      const formId = typeof cfg.formId === 'number' ? cfg.formId : null
      const formElement = formId != null ? formElements?.[formId] : undefined
      const formData = formId != null ? formsCache?.[formId] : undefined
      const title = asText(cfg.title) || formData?.name || 'Reserva tu lugar'

      let content: React.ReactNode
      if (formElement != null) {
        content = formElement
      } else if (formData != null) {
        const fieldElements = formData.fields.map((f) =>
          React.createElement(
            'label',
            {
              key: f.id,
              style: { display: 'grid', gap: '.35rem', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '.14em' },
            },
            `${f.label}${f.isRequired ? ' *' : ''}`,
            React.createElement('input', {
              placeholder: f.placeholder ?? '',
              disabled: true,
              style: { minHeight: 44, border: `1px solid ${theme.accentColor}55`, background: '#fff', padding: '0 .9rem', fontSize: 16 },
            }),
          ),
        )
        const buttonElement = React.createElement(
          'button',
          {
            disabled: true,
            style: { border: `1px solid ${theme.accentColor}`, background: theme.accentColor, color: theme.backgroundColor, padding: '1rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.14em', opacity: 0.7 },
          },
          formData.submitLabel,
        )
        content = React.createElement('div', { style: { display: 'grid', gap: '1rem' } }, ...fieldElements, buttonElement)
      } else if (formId == null) {
        content = registerForm ?? React.createElement(
          'div',
          { style: { border: '2px dashed #888', padding: '2rem', textAlign: 'center' as const, color: '#888', borderRadius: 4 } },
          'Selecciona un formulario en el panel derecho',
        )
      } else {
        content = React.createElement('div', { style: { color: '#888', padding: '1rem', textAlign: 'center' as const } }, 'Cargando formulario...')
      }

      return React.createElement(
        'section',
        { key: block.id, id: 'registro', style: { ...sectionStyle(theme), padding: '3rem 1.25rem' } },
        React.createElement(
          'div',
          { style: { maxWidth: 520, margin: '0 auto', background: theme.surfaceColor, padding: '2rem', border: `1px solid ${theme.accentColor}33` } },
          React.createElement('h2', { style: { marginTop: 0 } }, title),
          content,
        ),
      )
    }

    if (block.type === 'TEXT') {
      return React.createElement(
        'section',
        { key: block.id, style: { ...sectionStyle(theme), padding: '4rem 1.25rem' } },
        React.createElement(
          'div',
          { style: { maxWidth: 760, margin: '0 auto' } },
          React.createElement('h2', null, asText(cfg.title)),
          React.createElement('p', { style: { color: theme.mutedTextColor, lineHeight: 1.8, fontSize: '1.1rem' } }, asText(cfg.body)),
        ),
      )
    }

    if (block.type === 'CTA') {
      return React.createElement(
        'section',
        { key: block.id, style: { ...sectionStyle(theme), padding: '4rem 1.25rem', textAlign: 'center' } },
        React.createElement('h2', null, asText(cfg.title)),
        React.createElement('p', { style: { color: theme.mutedTextColor } }, asText(cfg.body)),
        React.createElement('a', { href: asText(cfg.href, '#'), style: buttonStyle(theme) }, asText(cfg.buttonText, 'Continuar')),
      )
    }

    if (block.type === 'WEBINAR_ROOM') {
      const iframe = webinarEmbedUrl
        ? React.createElement('iframe', {
            title: asText(cfg.title, 'Webinar'),
            src: webinarEmbedUrl,
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowFullScreen: true,
            style: { width: '100%', aspectRatio: '16 / 9', border: 0, background: '#000' },
          })
        : React.createElement('a', { href: webinarLink ?? '#', style: buttonStyle(theme) }, 'Entrar al webinar')

      return React.createElement(
        'section',
        { key: block.id, style: { ...sectionStyle(theme), padding: '3rem 1.25rem' } },
        React.createElement(
          'div',
          { style: { maxWidth: 1100, margin: '0 auto' } },
          React.createElement('h1', null, asText(cfg.title, 'Webinar en vivo')),
          React.createElement('p', { style: { color: theme.mutedTextColor } }, asText(cfg.body)),
          iframe,
        ),
      )
    }

    if (block.type === 'CUSTOM_HTML') {
      return React.createElement('section', {
        key: block.id,
        style: sectionStyle(theme),
        dangerouslySetInnerHTML: {
          __html: `<style>${sanitizeCss(asText(cfg.css))}</style>${sanitizeHtml(asText(cfg.html))}`,
        },
      })
    }

    if (block.type === 'FOOTER') {
      return React.createElement(
        'footer',
        { key: block.id, style: { ...sectionStyle(theme), padding: '2rem 1.25rem', borderTop: `1px solid ${theme.accentColor}44`, textAlign: 'center' } },
        asText(cfg.text),
      )
    }

    return null
  })
}
