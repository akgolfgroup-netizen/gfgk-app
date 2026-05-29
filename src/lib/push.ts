'use server'

import webpush from 'web-push'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { pushSubscriptions } from '@/db/schema'

/**
 * Web Push-utils. VAPID-nøkler settes i env. Hvis de mangler, hopper
 * sendingen over uten å feile (graceful — appen kjører uten push i dev).
 */

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:servicepunkt@gfgk.no'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

/**
 * Lagre en push-subscription for innlogget bruker (kalt fra klient).
 */
export async function saveSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent: string | null,
): Promise<void> {
  await getDb()
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent,
    })
    .onConflictDoNothing()
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await getDb().delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
}

/**
 * Send push til alle abonnement for en bruker. Rydder opp døde
 * subscriptions (410 Gone / 404).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; skipped: boolean }> {
  if (!ensureConfigured()) {
    console.log('[push] skipped (no VAPID keys):', payload.title)
    return { sent: 0, skipped: true }
  }

  const db = getDb()
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))

  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          JSON.stringify(payload),
        )
        sent++
      } catch (err: unknown) {
        const statusCode =
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? (err as { statusCode: number }).statusCode
            : 0
        if (statusCode === 410 || statusCode === 404) {
          // Død subscription — slett
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, s.endpoint))
        } else {
          console.error('[push] send failed:', statusCode, err)
        }
      }
    }),
  )

  return { sent, skipped: false }
}
