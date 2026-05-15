import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { defaultTheme } from '@/lib/funnels/defaults'
import { renderFunnelBlocks } from '@/lib/funnels/render'
import { resolveFunnelPagePath } from '@/lib/funnels/slug'
import { sanitizeCss, sanitizeHtml } from '@/lib/funnels/sanitize'
import type { FunnelBlock, FunnelTheme } from '@/lib/funnels/types'
import { FunnelRegisterForm } from '../_components/FunnelRegisterForm'

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
  const registerForm =
    selected.key === 'registration' ? <FunnelRegisterForm slug={funnel.slug} theme={theme} /> : null
  const webinarUrl = iframeSrc(funnel.webinar?.link)

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
          blocks: blocks(selected.blocks),
          theme,
          registerForm,
          webinarEmbedUrl: webinarUrl,
          webinarLink: funnel.webinar?.link,
        })
      )}
    </main>
  )
}
