import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { defaultTheme } from '@/lib/funnels/defaults'
import { renderFunnelBlocks } from '@/lib/funnels/render'
import { resolveFunnelPagePath } from '@/lib/funnels/slug'
import { sanitizeCss, sanitizeHtml } from '@/lib/funnels/sanitize'
import type { FunnelBlock, FunnelTheme, FormCacheEntry } from '@/lib/funnels/types'
import { FunnelRegisterForm } from '../_components/FunnelRegisterForm'
import { CrmFormEmbed } from '../_components/CrmFormEmbed'

interface Props {
  params: Promise<{ slug: string; page?: string[] }>
}

function normalizeTheme(value: unknown): FunnelTheme {
  return { ...defaultTheme, ...(value && typeof value === 'object' ? value : {}) } as FunnelTheme
}

function blocks(value: unknown): FunnelBlock[] {
  return Array.isArray(value) ? (value as FunnelBlock[]) : []
}

function iframeSrc(value: string | null | undefined): string | null {
  if (!value) return null
  const match = value.match(/src=["']([^"']+)["']/i)
  return match?.[1] ?? value
}

function extractFormEntries(pageBlocks: FunnelBlock[]): { formId: number; formSlug: string }[] {
  return pageBlocks
    .filter(
      (b) =>
        b.type === 'FORM' &&
        typeof b.config.formId === 'number' &&
        typeof b.config.formSlug === 'string',
    )
    .map((b) => ({ formId: b.config.formId as number, formSlug: b.config.formSlug as string }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page } = await params
  const key = resolveFunnelPagePath(page?.[0])
  const funnel = await prisma.funnel.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    include: { pages: true },
  })
  const selected = funnel?.pages.find((item) => item.key === key || item.slug === key)
  return {
    title: selected?.title ?? funnel?.name ?? 'Funnel',
    description: selected?.description ?? undefined,
  }
}

export default async function PublicFunnelPage({ params }: Props) {
  const { slug, page } = await params
  const key = resolveFunnelPagePath(page?.[0])
  const funnel = await prisma.funnel.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    include: {
      webinar: true,
      pages: { orderBy: { position: 'asc' } },
    },
  })
  if (!funnel) notFound()

  const selected = funnel.pages.find((item) => item.key === key || item.slug === key)
  if (!selected) notFound()

  const theme = normalizeTheme(funnel.theme)
  const pageBlocks = blocks(selected.blocks)
  const registerForm =
    selected.key === 'registration' ? <FunnelRegisterForm slug={funnel.slug} theme={theme} /> : null
  const webinarUrl = iframeSrc(funnel.webinar?.link)

  const formEntries = extractFormEntries(pageBlocks)
  const formElements: Record<number, React.ReactNode> = {}

  if (formEntries.length > 0) {
    const slugs = [...new Set(formEntries.map((e) => e.formSlug))]
    const dbForms = await prisma.crmForm.findMany({
      where: { slug: { in: slugs }, status: 'PUBLISHED', deletedAt: null },
      include: { fields: { orderBy: { position: 'asc' } } },
    })
    for (const dbForm of dbForms) {
      const entry: FormCacheEntry = {
        id: dbForm.id,
        name: dbForm.name,
        slug: dbForm.slug,
        submitLabel: dbForm.submitLabel,
        successMessage: dbForm.successMessage,
        fields: dbForm.fields.map((f) => ({
          id: f.id,
          label: f.label,
          fieldKey: f.fieldKey,
          type: f.type as string,
          placeholder: f.placeholder,
          isRequired: f.isRequired,
        })),
      }
      const fe = formEntries.find((e) => e.formSlug === dbForm.slug)
      if (fe) {
        formElements[fe.formId] = <CrmFormEmbed form={entry} theme={theme} />
      }
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: theme.backgroundColor, color: theme.textColor }}>
      {selected.mode === 'HTML' ? (
        <section
          dangerouslySetInnerHTML={{
            __html: `<style>${sanitizeCss(selected.customCss ?? '')}</style>${sanitizeHtml(selected.customHtml ?? '')}`,
          }}
        />
      ) : (
        renderFunnelBlocks({
          blocks: pageBlocks,
          theme,
          registerForm,
          webinarEmbedUrl: webinarUrl,
          webinarLink: funnel.webinar?.link,
          formElements,
        })
      )}
    </main>
  )
}
