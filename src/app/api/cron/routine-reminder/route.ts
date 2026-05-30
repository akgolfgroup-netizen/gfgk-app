import { NextResponse } from 'next/server'
import { sendRoutineReminder } from '@/lib/routine-reminder'

/**
 * Vercel Cron — kjøres på ettermiddagen (se vercel.json). Minner ansatte
 * med vakt i dag om gjenstående rutiner. Sikkerhet: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendRoutineReminder()
  return NextResponse.json({ ok: true, ...result })
}
