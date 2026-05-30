import { NextResponse } from 'next/server'
import { generateChecklistRunsForToday } from '@/lib/checklists'

/**
 * Vercel Cron-endpoint. Settes opp i vercel.ts/vercel.json med schedule '0 6 * * *'
 * (kl 06:00 hver morgen). Bygger checklist_runs for dagens dato.
 *
 * Sikkerhet: Vercel Cron sender Authorization-header med CRON_SECRET.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await generateChecklistRunsForToday()
  return NextResponse.json({ ok: true, ...result })
}
