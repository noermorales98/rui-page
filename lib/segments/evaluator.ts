import type { Prisma, ContactStatus, ContactSource, DealStage } from '@prisma/client'

type Op = 'eq' | 'in' | 'gte' | 'lte'

interface LeafFilter {
  field: string
  op: Op
  value: unknown
}

interface AndFilter {
  and: FilterNode[]
}

interface OrFilter {
  or: FilterNode[]
}

type FilterNode = LeafFilter | AndFilter | OrFilter

function isAnd(node: FilterNode): node is AndFilter {
  return 'and' in node && Array.isArray((node as AndFilter).and)
}

function isOr(node: FilterNode): node is OrFilter {
  return 'or' in node && Array.isArray((node as OrFilter).or)
}

function leafToWhere(leaf: LeafFilter): Prisma.ContactWhereInput {
  const { field, op, value } = leaf

  switch (field) {
    case 'status': {
      if (op === 'eq') {
        return { status: value as ContactStatus }
      }
      if (op === 'in') {
        return { status: { in: value as ContactStatus[] } }
      }
      return {}
    }
    case 'source': {
      if (op === 'eq') return { source: value as ContactSource }
      if (op === 'in') return { source: { in: value as ContactSource[] } }
      return {}
    }
    case 'tag': {
      const tags = (op === 'in' ? value : [value]) as string[]
      return {
        tags: {
          some: {
            tag: { name: { in: tags } },
          },
        },
      }
    }
    case 'createdAt': {
      const date = new Date(value as string)
      if (op === 'gte') return { createdAt: { gte: date } }
      if (op === 'lte') return { createdAt: { lte: date } }
      return {}
    }
    case 'dealStage': {
      const stages = (op === 'in' ? value : [value]) as DealStage[]
      return {
        deals: {
          some: {
            stage: { in: stages },
            deletedAt: null,
          },
        },
      }
    }
    default:
      return {}
  }
}

export function buildSegmentWhere(filters: unknown): Prisma.ContactWhereInput {
  if (!filters || typeof filters !== 'object') return {}
  const node = filters as FilterNode
  return nodeToWhere(node)
}

function nodeToWhere(node: FilterNode): Prisma.ContactWhereInput {
  if (isAnd(node)) {
    return { AND: node.and.map(nodeToWhere) }
  }
  if (isOr(node)) {
    return { OR: node.or.map(nodeToWhere) }
  }
  return leafToWhere(node as LeafFilter)
}

export async function evaluateSegment(
  filters: unknown,
  prismaClient: {
    contact: {
      count: (args: object) => Promise<number>
      findMany: (args: object) => Promise<{ id: number }[]>
    }
  },
): Promise<{ count: number; sampleIds: number[] }> {
  const where = buildSegmentWhere(filters)
  const baseWhere = { ...where, deletedAt: null }

  const [count, sample] = await Promise.all([
    prismaClient.contact.count({ where: baseWhere }),
    prismaClient.contact.findMany({
      where: baseWhere,
      select: { id: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { count, sampleIds: sample.map((c) => c.id) }
}
