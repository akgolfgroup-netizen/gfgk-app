import { NextResponse } from 'next/server'
import { ensureDraftFor } from '@/lib/ai-inbox'
import { ingestInboundMessage } from '@/lib/inbox'

interface ResendInboundPayload {
  // Resend Inbound payload (forenklet — match faktisk struktur ved oppsett)
  message_id?: string
  from?: { email?: string; name?: string }
  to?: Array<{ email?: string }>
  subject?: string
  text?: string
  html?: string
  in_reply_to?: string
  references?: string
}

/**
 * Webhook for Resend Inbound. Validerer Bearer-token og lagrer melding.
 *
 * Sett opp i Resend dashboard:
 * - Inbound-domene: gfgk.no (MX-records → Resend)
 * - Forward-rute: servicepunkt@gfgk.no → https://<app>/api/inbox/incoming
 * - Authorization-header: Bearer ${INBOX_WEBHOOK_SECRET}
 *
 * Etter ingest trigges AI-draft asynkront (best-effort).
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.INBOX_WEBHOOK_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: ResendInboundPayload
  try {
    payload = (await request.json()) as ResendInboundPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const externalId = payload.message_id ?? `inbox-${Date.now()}`
  const fromEmail = payload.from?.email
  const toEmail = payload.to?.[0]?.email
  const subject = payload.subject ?? '(uten emne)'

  if (!fromEmail || !toEmail) {
    return NextResponse.json({ error: 'Missing from/to' }, { status: 400 })
  }

  const ingest = await ingestInboundMessage({
    externalId,
    fromEmail,
    fromName: payload.from?.name ?? null,
    toEmail,
    subject,
    bodyText: payload.text ?? null,
    bodyHtml: payload.html ?? null,
    receivedAt: new Date(),
    threadId: payload.in_reply_to ?? payload.references ?? null,
  })

  if (!ingest) {
    return NextResponse.json({ error: 'Could not ingest' }, { status: 500 })
  }

  // Trigger AI-draft asynkront (ikke await — webhook bør være rask)
  if (ingest.isNew) {
    ensureDraftFor(ingest.id).catch((err) => {
      console.error('[inbox] AI draft failed:', err)
    })
  }

  return NextResponse.json({ ok: true, id: ingest.id, isNew: ingest.isNew })
}
