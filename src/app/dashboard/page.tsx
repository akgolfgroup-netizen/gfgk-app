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
      <main className="min-h-dvh px-6 pt-safe pb-24">
        <header className="py-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hei{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-neutral-500">{session.user.email}</p>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Kommende vakter
          </h2>
          {upcomingShifts.length === 0 ? (
            <p className="text-sm text-neutral-400">Ingen planlagte vakter.</p>
          ) : (
            <div className="space-y-2">
              {upcomingShifts.map((shift, i) => (
                <div key={i} className="rounded-2xl border border-neutral-200 p-4">
                  <p className="text-sm font-medium capitalize">{formatNorwegianDate(shift.date)}</p>
                  <p className="text-sm text-neutral-600">
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
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm"
          >
            Logg ut
          </button>
        </form>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
