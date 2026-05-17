import { and, asc, eq, gte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { getDb } from '@/db'
import { shifts } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { formatNorwegianDate, toDateString } from '@/lib/dates'

async function signOutAction() {
  'use server'
  await signOut({ redirectTo: '/login' })
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const today = toDateString(new Date())
  const upcomingShifts = await getDb()
    .select({
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      note: shifts.note,
    })
    .from(shifts)
    .where(and(eq(shifts.userId, session.user.id), eq(shifts.published, true), gte(shifts.date, today)))
    .orderBy(asc(shifts.date), asc(shifts.startTime))
    .limit(7)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-gfgk-gold">
              Hei{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-sm text-white/50 mt-0.5">{session.user.email}</p>
          </div>
        </header>

        <div className="px-6 pt-6">
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Kommende vakter
            </h2>
            {upcomingShifts.length === 0 ? (
              <p className="text-sm text-gfgk-text-3">Ingen planlagte vakter.</p>
            ) : (
              <div className="space-y-2">
                {upcomingShifts.map((shift, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gfgk-border border-l-4 border-l-gfgk-gold bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                  >
                    <p className="text-sm font-semibold text-gfgk-text capitalize">{formatNorwegianDate(shift.date)}</p>
                    <p className="text-sm text-gfgk-text-2 mt-0.5">
                      {shift.startTime}–{shift.endTime}
                      {shift.note ? ` · ${shift.note}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border-2 border-gfgk-black px-4 py-2 text-sm font-semibold text-gfgk-text hover:bg-gfgk-black hover:text-white transition-colors"
            >
              Logg ut
            </button>
          </form>
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
