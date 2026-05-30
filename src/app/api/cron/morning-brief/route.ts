import { NextResponse } from 'next/server'
import { generateChecklistRunsForToday } from '@/lib/checklists'
import { sendMorningBrief } from '@/lib/morning-brief'

/**
 * Vercel Cron — kjøres tidlig morgen (se vercel.json). Bygger dagens
 * checklist-runs og sender deretter morgenbrief til alle med vakt i dag.
 * Sikkerhet: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const runs = await generateChecklistRunsForToday()
  const brief = await sendMorningBrief()
  return NextResponse.json({ ok: true, runs, brief })
}
