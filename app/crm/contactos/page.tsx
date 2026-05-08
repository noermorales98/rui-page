import { prisma } from '@/lib/prisma'
import { ContactsTable } from './_components/ContactsTable'
import { ContactFilters } from './_components/ContactFilters'
import { CreateContactModal } from './_components/CreateContactModal'
import { ImportCsvModal } from './_components/ImportCsvModal'

const PAGE_SIZE = 50

interface Props {
  searchParams: Promise<{ q?: string; status?: string; source?: string; tag?: string; page?: string }>
}

export default async function ContactosPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const status = params.status ?? ''
  const source = params.source ?? ''
  const tagId = params.tag ? Number(params.tag) : undefined
  const page = Math.max(1, Number(params.page ?? 1))
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
    ...(status ? { status: status as 'NEW' | 'QUALIFIED' | 'CLIENT' } : {}),
    ...(source ? { source: source as 'WEBINAR' | 'FORM' | 'MANUAL' | 'IMPORT' } : {}),
    ...(tagId ? { tags: { some: { tagId } } } : {}),
  }

  const [contacts, total, allTags] = await Promise.all([
    prisma.contact.findMany({
      where, skip, take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.contact.count({ where }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Contactos</h1>
          <p className="mt-1.5 text-sm text-[#8a8a8a]">{total} {total === 1 ? 'contacto' : 'contactos'}</p>
        </div>
        <div className="flex gap-2">
          <ImportCsvModal />
          <CreateContactModal tags={allTags} />
        </div>
      </div>

      {/* Filters */}
      <ContactFilters tags={allTags} />

      {/* Table card */}
      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-6">
        <ContactsTable contacts={contacts} />
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-[#8a8a8a]">
          <span>Mostrando {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} de {total}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="bg-white rounded-full px-4 py-2 text-[#080808] text-sm font-medium hover:bg-[#f2f2f2] transition shadow-sm">
                Anterior
              </a>
            )}
            {skip + PAGE_SIZE < total && (
              <a href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="bg-white rounded-full px-4 py-2 text-[#080808] text-sm font-medium hover:bg-[#f2f2f2] transition shadow-sm">
                Siguiente
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
