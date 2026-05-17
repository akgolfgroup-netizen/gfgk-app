import { and, gte, lte } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { users, timeEntries } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { setHourlyRate } from '@/lib/projects'

function formatKr(amount: number) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(amount)
}

export default async function LonnPage({
  searchParams,
}: {
  searchParams: Promise<{ mnd?: string }>
}) {
  const [{ mnd }, session] = await Promise.all([searchParams, auth()])

  const now = new Date()
  const [year, month] = ((): [number, number] => {
    if (mnd) {
      const parts = mnd.split('-')
      return [Number(parts[0]), Number(parts[1])]
    }
    return [now.getFullYear(), now.getMonth() + 1]
  })()

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('nb-NO', { month: 'long', year: 'numeric' })

  const prevMnd = (() => { const d = new Date(year, month - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })()
  const nextMnd = (() => { const d = new Date(year, month, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })()

  const db = getDb()
  const [allUsers, entries] = await Promise.all([
    db.select({ id: users.id, name: users.name, email: users.email, hourlyRate: users.hourlyRate }).from(users).orderBy(users.name),
    db.select().from(timeEntries).where(and(gte(timeEntries.date, monthStart), lte(timeEntries.date, monthEnd))),
  ])

  const summary = allUsers.map((user) => {
    const userEntries = entries.filter((e) => e.userId === user.id)
    const totalHours = userEntries.reduce((s, e) => s + parseFloat(e.hours), 0)
    const lonnKost = user.hourlyRate ? totalHours * user.hourlyRate : null
    return { ...user, totalHours, lonnKost, entries: userEntries }
  })

  const totalLonnKost = summary.reduce((s, u) => s + (u.lonnKost ?? 0), 0)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <a href="/admin" className="text-sm text-white/50 hover:text-white/80 transition-colors">← Admin</a>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gfgk-gold">Lønn</h1>
          </div>
        </header>

        <div className="px-6 pt-6 space-y-6">
          {/* Månednavigasjon */}
          <div className="flex items-center justify-between">
            <a href={`/admin/lonn?mnd=${prevMnd}`} className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-[0_1px_2px_rgba(0,0,0,.06)]">←</a>
            <span className="text-sm font-bold capitalize text-gfgk-text">{monthLabel}</span>
            <a href={`/admin/lonn?mnd=${nextMnd}`} className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-[0_1px_2px_rgba(0,0,0,.06)]">→</a>
          </div>

          {/* Total lønnskostnad */}
          <div className="overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]">
            <div className="bg-gfgk-black px-4 py-3">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/50">Total lønnskostnad</p>
            </div>
            <div className="bg-white px-4 py-3">
              <p className="text-2xl font-extrabold text-gfgk-gold">{formatKr(totalLonnKost)}</p>
            </div>
          </div>

          {/* Per ansatt */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Per ansatt
            </h2>
            {summary.map((user) => (
              <div key={user.id} className="overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                <div className="bg-gfgk-black px-4 py-2.5 flex items-center justify-between">
                  <p className="text-sm font-bold text-white">{user.name ?? user.email}</p>
                  <p className="text-sm font-extrabold text-gfgk-gold">
                    {user.lonnKost != null ? formatKr(user.lonnKost) : '—'}
                  </p>
                </div>
                <div className="bg-white px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gfgk-text-2">{user.totalHours.toFixed(1)} timer</span>
                    <span className="text-gfgk-text-2">{user.hourlyRate ? `${user.hourlyRate} kr/t` : 'Ingen timesats'}</span>
                  </div>
                  <form action={setHourlyRate.bind(null, user.id)} className="flex gap-2">
                    <input
                      name="hourlyRate"
                      type="number"
                      min="0"
                      defaultValue={user.hourlyRate ?? ''}
                      placeholder="Timesats (kr)"
                      className="flex-1 !py-2 !text-sm"
                    />
                    <button type="submit" className="rounded-md bg-gfgk-gold px-3 py-2 text-xs font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors whitespace-nowrap">
                      Lagre
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
