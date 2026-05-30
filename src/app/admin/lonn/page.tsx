import { and, gte, lte } from 'drizzle-orm'
import { getDb } from '@/db'
import { users, timeEntries } from '@/db/schema'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { setHourlyRate } from '@/lib/users-admin'

function formatKr(amount: number) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(amount)
}

function formatNum(amount: number) {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(amount)
}

export default async function LonnPage({
  searchParams,
}: {
  searchParams: Promise<{ mnd?: string }>
}) {
  const { mnd } = await searchParams

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
        <PageHeader
          title="Lønn"
          back={{ href: '/admin', label: 'Admin' }}
          maxWidth="6xl"
        />

        <div className="px-6 pt-6 space-y-6 lg:mx-auto lg:max-w-6xl">
          {/* Månednavigasjon */}
          <div className="flex items-center justify-between">
            <a href={`/admin/lonn?mnd=${prevMnd}`} className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-card">←</a>
            <span className="text-sm font-bold capitalize text-gfgk-text">{monthLabel}</span>
            <a href={`/admin/lonn?mnd=${nextMnd}`} className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-card">→</a>
          </div>

          {/* Total lønnskostnad — featured KPI */}
          <div className="rounded-2xl bg-gfgk-black px-5 py-5 shadow-hero">
            <p className="eyebrow text-gfgk-gold">Total lønnskostnad</p>
            <p className="kpi-value mt-2 text-4xl text-white">
              {formatNum(totalLonnKost)}
              <span className="ml-1.5 text-base font-normal text-white/50">kr</span>
            </p>
            <p className="mt-1 text-[13px] text-white/50 capitalize">{monthLabel}</p>
          </div>

          {/* Per ansatt */}
          <section className="space-y-3">
            <SectionLabel>Per ansatt</SectionLabel>
            {summary.map((user) => (
              <Card key={user.id} padding="md" className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gfgk-text">{user.name ?? user.email}</p>
                  <p className="font-mono-nums text-sm font-semibold text-gfgk-text">
                    {user.lonnKost != null ? formatKr(user.lonnKost) : '—'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[13px] text-gfgk-text-2">
                  <span className="font-mono-nums">{user.totalHours.toFixed(1)} timer</span>
                  <span>{user.hourlyRate ? `${user.hourlyRate} kr/t` : 'Ingen timesats'}</span>
                </div>
                <form action={setHourlyRate.bind(null, user.id)} className="flex gap-2">
                  <input
                    name="hourlyRate"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    defaultValue={user.hourlyRate ?? ''}
                    placeholder="Timesats (kr)"
                    className="flex-1 !h-10 !py-0 !text-sm"
                  />
                  <Button type="submit" size="sm">
                    Lagre
                  </Button>
                </form>
              </Card>
            ))}
          </section>
        </div>
    </>
  )
}
