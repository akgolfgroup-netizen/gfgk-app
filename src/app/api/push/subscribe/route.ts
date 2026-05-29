import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { saveSubscription } from '@/lib/push'

interface SubscribeBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SubscribeBody
  try {
    body = (await request.json()) as SubscribeBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: 'Missing subscription fields' }, { status: 400 })
  }

  const h = await headers()
  await saveSubscription(
    session.user.id,
    { endpoint: body.endpoint, keys: { p256dh: body.keys.p256dh, auth: body.keys.auth } },
    h.get('user-agent'),
  )

  return NextResponse.json({ ok: true })
}
