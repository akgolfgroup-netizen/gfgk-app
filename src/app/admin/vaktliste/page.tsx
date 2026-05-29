import Link from 'next/link'
import { and, eq, gte, lte } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { shifts, users } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import {
  addDays,
  formatNorwegianDate,
  getMonday,
  getWeekDays,
  getWeekNumber,
  toDateString,
} from '@/lib/dates'
import { ConfirmButton } from '@/components/ConfirmButton'
import { createShift, deleteShift, publishWeek } from '@/lib/shifts'

export default async function VaktlistePage({
  searchParams,
}: {
  searchParams: Promise<{ uke?: string }>
}) {
  const [{ uke }, session] = await Promise.all([searchParams, auth()])

  const monday = uke ? new Date(uke + 'T00:00:00') : getMonday(new Date())
  const weekStart = toDateString(monday)
  const weekEnd = toDateString(addDays(monday, 6))
  const weekDays = getWeekDays(monday)
  const weekNum = getWeekNumber(monday)
  const prevMonday = toDateString(addDays(monday, -7))
  const nextMonday = toDateString(addDays(monday, 7))

  const db = getDb()
  const [weekShifts, allUsers] = await Promise.all([
    db
      .select({
        id: shifts.id,
        date: shifts.date,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        note: shifts.note,
        published: shifts.published,
        userName: users.name,
        userEmail: users.email,
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.userId, users.id))
      .where(and(gte(shifts.date, weekStart), lte(shifts.date, weekEnd)))
      .orderBy(shifts.startTime),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .orderBy(users.name),
  ])

  const hasUnpublished = weekShifts.some((s) => !s.published)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <a href="/admin" className="text-sm text-white/50 hover:text-white/80 transition-colors">
              ← Admin
            </a>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gfgk-gold">Vaktliste</h1>
          </div>
        </header>

        <div className="px-6 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={`/admin/vaktliste?uke=${prevMonday}`}
              className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-[0_1px_2px_rgba(0,0,0,.06)]"
            >
              ←
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded bg-gfgk-black px-2 py-0.5 text-[11px] font-extrabold text-gfgk-gold uppercase tracking-wide">
                Uke {weekNum}
              </span>
            </span>
            <Link
              href={`/admin/vaktliste?uke=${nextMonday}`}
              className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-[0_1px_2px_rgba(0,0,0,.06)]"
            >
              →
            </Link>
          </div>

          <Link
            href={`/admin/vaktliste/generer?uke=${weekStart}`}
            className="mb-3 block w-full rounded-md border-2 border-gfgk-black bg-white py-3 text-center text-sm font-bold text-gfgk-text hover:bg-gfgk-black hover:text-white transition-colors"
          >
            Auto-generer vakter →
          </Link>

          {hasUnpublished && (
            <form action={publishWeek.bind(null, weekStart)} className="mb-6">
              <button
                type="submit"
                className="w-full rounded-md bg-gfgk-gold py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors"
              >
                Publiser vaktliste for uke {weekNum}
              </button>
            </form>
          )}

          <div className="mb-8 space-y-6">
            {weekDays.map((day) => {
              const key = toDateString(day)
              const dayShifts = weekShifts.filter((s) => s.date === key)
              return (
                <div key={key}>
                  <h2 className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
                    <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
                    {formatNorwegianDate(key)}
                  </h2>
                  {dayShifts.length === 0 ? (
                    <p className="text-sm text-gfgk-text-3">Ingen vakter</p>
                  ) : (
                    <div className="space-y-2">
                      {dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between rounded-lg border border-gfgk-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                        >
                          <div>
                            <p className="text-sm font-bold text-gfgk-black">
                              {shift.userName ?? shift.userEmail}
                            </p>
                            <p className="text-xs text-gfgk-text-2 mt-0.5">
                              {shift.startTime}–{shift.endTime}
                              {shift.note ? ` · ${shift.note}` : ''}
                            </p>
                            {!shift.published && (
                              <span className="text-xs text-gfgk-gold-deep font-medium">Ikke publisert</span>
                            )}
                          </div>
                          <form action={deleteShift.bind(null, shift.id)}>
                            <ConfirmButton
                              message="Er du sikker på at du vil slette denne vakten?"
                              className="rounded-md border border-gfgk-red/30 bg-gfgk-red-light px-3 py-1 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20 transition-colors"
                            >
                              Slett
                            </ConfirmButton>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Ny vakt
            </h2>
            <form action={createShift} className="space-y-4 rounded-lg border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Dato</span>
                <select name="date" className="w-full">
                  {weekDays.map((day) => {
                    const key = toDateString(day)
                    return (
                      <option key={key} value={key}>
                        {formatNorwegianDate(key)}
                      </option>
                    )
                  })}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Ansatt</span>
                <select name="userId" className="w-full">
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-gfgk-text">Fra</span>
                  <input name="startTime" type="time" required className="w-full" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-gfgk-text">Til</span>
                  <input name="endTime" type="time" required className="w-full" />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Notat (valgfritt)</span>
                <input name="note" type="text" className="w-full" />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-gfgk-gold py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors"
              >
                Legg til vakt
              </button>
            </form>
          </section>
        </div>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
