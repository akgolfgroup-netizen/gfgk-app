import { and, gte, lte } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { transactions } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'

function formatKr(amount: number) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(amount)
}

function getMonths(count: number) {
  const months = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('nb-NO', { month: 'short', year: '2-digit' }),
      start: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      end: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`,
    })
  }
  return months
}

export default async function RapporterPage() {
  const session = await auth()
  const months = getMonths(6)

  const first = months[0]
  const last = months[months.length - 1]
  const db = getDb()
  const rows = first && last ? await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, first.start), lte(transactions.date, last.end))) : []

  const monthData = months.map((m) => {
    const monthRows = rows.filter((r) => r.date >= m.start && r.date <= m.end)
    const inntekt = monthRows.filter((r) => r.type === 'inntekt').reduce((s, r) => s + r.amount, 0)
    const utgift = monthRows.filter((r) => r.type === 'utgift').reduce((s, r) => s + r.amount, 0)
    const resultat = inntekt - utgift
    return { label: m.label, start: m.start, end: m.end, inntekt, utgift, resultat }
  })

  const maxValue = Math.max(...monthData.map((m) => Math.max(m.inntekt, m.utgift)), 1)

  const kategorierInntekt = rows
    .filter((r) => r.type === 'inntekt')
    .reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + r.amount }), {})

  const kategorierUtgift = rows
    .filter((r) => r.type === 'utgift')
    .reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + r.amount }), {})

  const totalInntekt = monthData.reduce((s, m) => s + m.inntekt, 0)
  const totalUtgift = monthData.reduce((s, m) => s + m.utgift, 0)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4 flex items-start justify-between gap-3">
            <div>
              <a href="/admin" className="text-sm text-white/50 hover:text-white/80 transition-colors">← Admin</a>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gfgk-gold">Rapporter</h1>
              <p className="text-sm text-white/50 mt-0.5">Siste 6 måneder</p>
            </div>
            {first && last && (
              <a
                href={`/api/rapporter/export?from=${first.start}&to=${last.end}`}
                className="rounded-md bg-gfgk-gold px-3 py-1.5 text-xs font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors whitespace-nowrap"
              >
                ↓ CSV
              </a>
            )}
          </div>
        </header>

        <div className="px-6 pt-6 space-y-8">
          {/* Sammendrag */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Inntekter', value: totalInntekt, color: 'text-gfgk-teal-deep', bg: 'bg-gfgk-teal-light' },
              { label: 'Utgifter', value: totalUtgift, color: 'text-gfgk-red-deep', bg: 'bg-gfgk-red-light' },
              { label: 'Resultat', value: totalInntekt - totalUtgift, color: totalInntekt >= totalUtgift ? 'text-gfgk-teal-deep' : 'text-gfgk-red-deep', bg: 'bg-gfgk-black' },
            ].map((item) => (
              <div key={item.label} className="overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                <div className={`${item.bg} px-3 py-2 text-center`}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wide text-white/80">{item.label}</p>
                </div>
                <div className="bg-white px-3 py-2 text-center">
                  <p className={`text-sm font-bold ${item.color}`}>{formatKr(item.value)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Søylediagram */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Månedlig oversikt
            </h2>
            <div className="rounded-lg border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <div className="flex items-end gap-2 h-36">
                {monthData.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '100px' }}>
                      <div
                        className="flex-1 rounded-t bg-gfgk-teal-light"
                        style={{ height: `${Math.round((m.inntekt / maxValue) * 100)}%`, minHeight: m.inntekt > 0 ? '4px' : '0' }}
                      />
                      <div
                        className="flex-1 rounded-t bg-gfgk-red-light"
                        style={{ height: `${Math.round((m.utgift / maxValue) * 100)}%`, minHeight: m.utgift > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <p className="text-[9px] font-medium text-gfgk-text-3 capitalize">{m.label}</p>
                    <p className={`text-[9px] font-bold ${m.resultat >= 0 ? 'text-gfgk-teal-deep' : 'text-gfgk-red-deep'}`}>
                      {m.resultat >= 0 ? '+' : ''}{formatKr(m.resultat)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gfgk-text-2">
                <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-gfgk-teal-light inline-block" />Inntekter</span>
                <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-gfgk-red-light inline-block" />Utgifter</span>
              </div>
            </div>
          </section>

          {/* Kategorier */}
          <div className="grid grid-cols-2 gap-4">
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
                <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
                Inntektskategorier
              </h2>
              <div className="space-y-2">
                {Object.entries(kategorierInntekt)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between rounded-lg border border-gfgk-border bg-white px-3 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                      <span className="text-gfgk-text-2 truncate">{cat}</span>
                      <span className="font-bold text-gfgk-teal-deep ml-2 whitespace-nowrap">{formatKr(amt)}</span>
                    </div>
                  ))}
                {Object.keys(kategorierInntekt).length === 0 && <p className="text-sm text-gfgk-text-3">Ingen data</p>}
              </div>
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
                <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
                Utgiftskategorier
              </h2>
              <div className="space-y-2">
                {Object.entries(kategorierUtgift)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between rounded-lg border border-gfgk-border bg-white px-3 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,.06)]">
                      <span className="text-gfgk-text-2 truncate">{cat}</span>
                      <span className="font-bold text-gfgk-red-deep ml-2 whitespace-nowrap">{formatKr(amt)}</span>
                    </div>
                  ))}
                {Object.keys(kategorierUtgift).length === 0 && <p className="text-sm text-gfgk-text-3">Ingen data</p>}
              </div>
            </section>
          </div>
        </div>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
