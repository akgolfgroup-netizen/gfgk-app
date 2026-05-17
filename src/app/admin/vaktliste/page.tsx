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
      <main className="min-h-dvh px-6 pt-safe pb-24">
        <header className="py-6">
          <a href="/admin" className="text-sm text-neutral-500">
            ← Admin
          </a>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Vaktliste</h1>
        </header>

        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/admin/vaktliste?uke=${prevMonday}`}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm"
          >
            ←
          </Link>
          <span className="text-sm font-medium">Uke {weekNum}</span>
          <Link
            href={`/admin/vaktliste?uke=${nextMonday}`}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm"
          >
            →
          </Link>
        </div>

        {hasUnpublished && (
          <form action={publishWeek.bind(null, weekStart)} className="mb-6">
            <button
              type="submit"
              className="w-full rounded-full bg-neutral-900 py-3 text-sm font-medium text-white"
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
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {formatNorwegianDate(key)}
                </h2>
                {dayShifts.length === 0 ? (
                  <p className="text-sm text-neutral-400">Ingen vakter</p>
                ) : (
                  <div className="space-y-2">
                    {dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between rounded-2xl border border-neutral-200 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {shift.userName ?? shift.userEmail}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {shift.startTime}–{shift.endTime}
                            {shift.note ? ` · ${shift.note}` : ''}
                          </p>
                          {!shift.published && (
                            <span className="text-xs text-amber-600">Ikke publisert</span>
                          )}
                        </div>
                        <form action={deleteShift.bind(null, shift.id)}>
                          <button
                            type="submit"
                            className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600"
                          >
                            Slett
                          </button>
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
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Ny vakt
          </h2>
          <form action={createShift} className="space-y-4 rounded-2xl border border-neutral-200 p-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Dato</span>
              <select
                name="date"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-neutral-900"
              >
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
            <label className="block space-y-2">
              <span className="text-sm font-medium">Ansatt</span>
              <select
                name="userId"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-neutral-900"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Fra</span>
                <input
                  name="startTime"
                  type="time"
                  required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">Til</span>
                <input
                  name="endTime"
                  type="time"
                  required
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
                />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Notat (valgfritt)</span>
              <input
                name="note"
                type="text"
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-neutral-900 py-3 text-sm font-medium text-white"
            >
              Legg til vakt
            </button>
          </form>
        </section>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
