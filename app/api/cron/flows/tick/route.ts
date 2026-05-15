import { processPendingSteps } from '@/lib/flows/engine'

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await processPendingSteps()
  return Response.json(result)
}
