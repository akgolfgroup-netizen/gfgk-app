import { and, desc, gte, lte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { timeEntries } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { toDateString } from '@/lib/dates'
import { ConfirmButton } from '@/components/ConfirmButton'
import { updateProfile, changePassword } from '@/lib/profile'
import { createTimeEntry, deleteTimeEntry } from '@/lib/timeEntries'

function formatHours(h: string | number) {
  return `${parseFloat(String(h)).toFixed(1)} t`
}

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthEnd = toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  const today = toDateString(now)

  const myEntries = await getDb()
    .select()
    .from(timeEntries)
    .where(
      and(
        and(
          gte(timeEntries.date, monthStart),
          lte(timeEntries.date, monthEnd)
        )
      )
    )
    .orderBy(desc(timeEntries.date))

  const totalHours = myEntries
    .filter((e) => e.userId === session.user.id)
    .reduce((s, e) => s + parseFloat(e.hours), 0)

  const myMonthEntries = myEntries.filter((e) => e.userId === session.user.id)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-gfgk-gold">Min profil</h1>
            <p className="text-sm text-white/50 mt-0.5">{session.user.email}</p>
          </div>
        </header>

        <div className="px-6 pt-6 space-y-8">
          {/* Oppdater navn */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Personlig informasjon
            </h2>
            <form action={updateProfile} className="space-y-4 rounded-lg border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Navn</span>
                <input name="name" type="text" required defaultValue={session.user.name ?? ''} className="w-full" />
              </label>
              <button type="submit" className="rounded-md bg-gfgk-gold px-4 py-2.5 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors">
                Lagre navn
              </button>
            </form>
          </section>

          {/* Bytt passord */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Bytt passord
            </h2>
            <form action={changePassword} className="space-y-4 rounded-lg border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Nåværende passord</span>
                <input name="current" type="password" required autoComplete="current-password" className="w-full" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Nytt passord</span>
                <input name="password" type="password" required minLength={8} autoComplete="new-password" className="w-full" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Bekreft nytt passord</span>
                <input name="confirmPassword" type="password" required autoComplete="new-password" className="w-full" />
              </label>
              <button type="submit" className="rounded-md bg-gfgk-gold px-4 py-2.5 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors">
                Bytt passord
              </button>
            </form>
          </section>

          {/* Timeregistrering */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Timeregistrering denne måneden
            </h2>

            <div className="mb-3 rounded-lg border border-gfgk-border bg-gfgk-black p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/50">Totalt</p>
              <p className="text-2xl font-extrabold text-gfgk-gold mt-1">{totalHours.toFixed(1)} timer</p>
            </div>

            {myMonthEntries.length > 0 && (
              <div className="mb-4 space-y-2">
                {myMonthEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg border border-gfgk-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                    <div>
                      <p className="text-sm font-semibold text-gfgk-text">{formatHours(entry.hours)}</p>
                      <p className="text-xs text-gfgk-text-2">
                        {new Date(entry.date + 'T00:00:00').toLocaleDateString('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </p>
                    </div>
                    <form action={deleteTimeEntry.bind(null, entry.id)}>
                      <ConfirmButton message="Slette denne timeregistreringen?" className="rounded-md bg-gfgk-red-light px-3 py-1 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20 transition-colors">
                        Slett
                      </ConfirmButton>
                    </form>
                  </div>
                ))}
              </div>
            )}

            <form action={createTimeEntry} className="space-y-4 rounded-lg border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-gfgk-text">Dato</span>
                  <input name="date" type="date" required defaultValue={today} className="w-full" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-gfgk-text">Timer</span>
                  <input name="hours" type="number" required min="0.5" max="24" step="0.5" placeholder="7.5" className="w-full" />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-gfgk-text">Notat (valgfritt)</span>
                <input name="note" type="text" className="w-full" />
              </label>
              <button type="submit" className="w-full rounded-md bg-gfgk-gold py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors">
                Registrer timer
              </button>
            </form>
          </section>
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
