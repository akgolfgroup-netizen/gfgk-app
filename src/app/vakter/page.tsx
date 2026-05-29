import { and, asc, eq, gte, lte } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shifts } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { ShiftEventForm } from '@/components/blocks/ShiftEventForm'
import { logShiftEvent } from '@/lib/shift-events'
import { toDateString } from '@/lib/dates'

const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']

export default async function VakterPage({
  searchParams,
}: {
  searchParams: Promise<{ mnd?: string }>
}) {
  const [{ mnd }, session] = await Promise.all([searchParams, auth()])
  if (!session?.user) redirect('/login')

  const now = new Date()
  const [year, month] = ((): [number, number] => {
    if (mnd) {
      const parts = mnd.split('-')
      return [Number(parts[0]), Number(parts[1])]
    }
    return [now.getFullYear(), now.getMonth() + 1]
  })()

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const prevMnd = (() => { const d = new Date(year, month - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })()
  const nextMnd = (() => { const d = new Date(year, month, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })()

  const myShifts = await getDb()
    .select({
      id: shifts.id,
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      note: shifts.note,
    })
    .from(shifts)
    .where(and(eq(shifts.userId, session.user.id), eq(shifts.published, true), gte(shifts.date, monthStart), lte(shifts.date, monthEnd)))
    .orderBy(asc(shifts.date), asc(shifts.startTime))

  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const cells: Array<{ day: number | null; date: string | null; shiftsForDay: typeof myShifts }> = []
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, date: null, shiftsForDay: [] })
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, date: dateStr, shiftsForDay: myShifts.filter((s) => s.date === dateStr) })
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, date: null, shiftsForDay: [] })

  const today = toDateString(now)
  const totalShifts = myShifts.length
  const monthName = MONTHS[month - 1]

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-gfgk-gold">Mine vakter</h1>
            <p className="text-sm text-white/50 mt-0.5 capitalize">{monthName} {year} · {totalShifts} {totalShifts === 1 ? 'vakt' : 'vakter'}</p>
          </div>
        </header>

        <div className="px-6 pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <Link href={`/vakter?mnd=${prevMnd}`} className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-[0_1px_2px_rgba(0,0,0,.06)]">←</Link>
            <span className="text-sm font-bold capitalize text-gfgk-text">{monthName} {year}</span>
            <Link href={`/vakter?mnd=${nextMnd}`} className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-[0_1px_2px_rgba(0,0,0,.06)]">→</Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-gfgk-border bg-white shadow-[0_1px_2px_rgba(0,0,0,.06)]">
            <div className="grid grid-cols-7 bg-gfgk-black">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center py-2 text-[10px] font-extrabold uppercase tracking-wide text-gfgk-gold">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((cell, i) => {
                const isToday = cell.date === today
                const hasShifts = cell.shiftsForDay.length > 0
                return (
                  <div
                    key={i}
                    className={`min-h-[64px] border-b border-r border-gfgk-border p-1.5 ${
                      cell.day === null ? 'bg-gfgk-cream-deep/40' : ''
                    } ${isToday ? 'bg-gfgk-gold-light' : ''}`}
                  >
                    {cell.day !== null && (
                      <>
                        <div className={`text-xs font-semibold ${isToday ? 'text-gfgk-gold-deep' : 'text-gfgk-text-2'}`}>
                          {cell.day}
                        </div>
                        {hasShifts && (
                          <div className="mt-1 space-y-0.5">
                            {cell.shiftsForDay.map((s) => (
                              <div key={s.id} className="rounded bg-gfgk-gold px-1 py-0.5 text-[9px] font-bold text-gfgk-black truncate">
                                {s.startTime.slice(0, 5)}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {myShifts.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
                <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
                Detaljer
              </h2>
              <div className="space-y-2">
                {myShifts.map((s) => (
                  <div key={s.id} className="rounded-lg border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                    <p className="text-sm font-semibold text-gfgk-text capitalize">
                      {new Date(s.date + 'T00:00:00').toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-sm text-gfgk-text-2 mt-0.5">
                      {s.startTime}–{s.endTime}
                      {s.note ? ` · ${s.note}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Loggfør hendelse fra denne måneden */}
          <section>
            <ShiftEventForm shiftId={null} onLog={logShiftEvent} />
          </section>
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
