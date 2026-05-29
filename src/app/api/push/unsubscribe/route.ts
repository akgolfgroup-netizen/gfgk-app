import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteSubscription } from '@/lib/push'

interface UnsubscribeBody {
  endpoint?: string
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: UnsubscribeBody
  try {
    body = (await request.json()) as UnsubscribeBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  await deleteSubscription(body.endpoint)
  return NextResponse.json({ ok: true })
}
