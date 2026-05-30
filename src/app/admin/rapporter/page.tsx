import { and, gte, lte } from 'drizzle-orm'
import { Download } from 'lucide-react'
import { getDb } from '@/db'
import { transactions } from '@/db/schema'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionLabel } from '@/components/ui/SectionLabel'

function formatKr(amount: number) {
  return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(amount)
}

function formatNum(amount: number) {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(amount)
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
        <PageHeader
          title="Rapporter"
          subtitle="Siste 6 måneder"
          back={{ href: '/admin', label: 'Admin' }}
          maxWidth="6xl"
          action={
            first && last ? (
              <a
                href={`/api/rapporter/export?from=${first.start}&to=${last.end}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gfgk-gold px-3.5 py-2 text-xs font-bold text-gfgk-black transition-colors hover:bg-gfgk-gold-deep"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
                CSV
              </a>
            ) : undefined
          }
        />

        <div className="px-6 pt-6 space-y-8 lg:mx-auto lg:max-w-6xl">
          {/* Sammendrag */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'Inntekter', value: totalInntekt, color: 'text-gfgk-teal-deep', accent: 'teal' as const },
              { label: 'Utgifter', value: totalUtgift, color: 'text-gfgk-red-deep', accent: 'red' as const },
              {
                label: 'Resultat',
                value: totalInntekt - totalUtgift,
                color: totalInntekt >= totalUtgift ? 'text-gfgk-teal-deep' : 'text-gfgk-red-deep',
                accent: 'gold' as const,
              },
            ]).map((item) => (
              <Card key={item.label} padding="sm" accent={item.accent}>
                <p className="kpi-label">{item.label}</p>
                <p className={`kpi-value mt-1 text-lg ${item.color}`}>
                  {item.value < 0 ? '−' : ''}
                  {formatNum(Math.abs(item.value))}
                </p>
                <p className="kpi-label mt-0.5 !tracking-wider">kr</p>
              </Card>
            ))}
          </div>

          {/* Søylediagram */}
          <section>
            <SectionLabel>Månedlig oversikt</SectionLabel>
            <div className="rounded-2xl border border-gfgk-border bg-white p-4 shadow-card">
              <div className="flex items-end gap-2 h-40">
                {monthData.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '100px' }}>
                      <div
                        className="flex-1 rounded-t bg-gfgk-teal"
                        style={{ height: `${Math.round((m.inntekt / maxValue) * 100)}%`, minHeight: m.inntekt > 0 ? '4px' : '0' }}
                      />
                      <div
                        className="flex-1 rounded-t bg-gfgk-red"
                        style={{ height: `${Math.round((m.utgift / maxValue) * 100)}%`, minHeight: m.utgift > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <p className="eyebrow capitalize">{m.label}</p>
                    <p className={`font-mono-nums text-[10px] font-semibold ${m.resultat >= 0 ? 'text-gfgk-teal-deep' : 'text-gfgk-red-deep'}`}>
                      {m.resultat >= 0 ? '+' : '−'}{formatNum(Math.abs(m.resultat))}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gfgk-text-2">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gfgk-teal inline-block" />Inntekter</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gfgk-red inline-block" />Utgifter</span>
              </div>
            </div>
          </section>

          {/* Kategorier */}
          <div className="grid grid-cols-2 gap-4">
            <section>
              <SectionLabel>Inntektskategorier</SectionLabel>
              <div className="space-y-2">
                {Object.entries(kategorierInntekt)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between rounded-xl border border-gfgk-border bg-white px-3 py-2.5 text-sm shadow-card">
                      <span className="text-gfgk-text-2 truncate">{cat}</span>
                      <span className="font-mono-nums font-semibold text-gfgk-teal-deep ml-2 whitespace-nowrap">{formatKr(amt)}</span>
                    </div>
                  ))}
                {Object.keys(kategorierInntekt).length === 0 && <p className="text-sm text-gfgk-text-3">Ingen data</p>}
              </div>
            </section>

            <section>
              <SectionLabel>Utgiftskategorier</SectionLabel>
              <div className="space-y-2">
                {Object.entries(kategorierUtgift)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between rounded-xl border border-gfgk-border bg-white px-3 py-2.5 text-sm shadow-card">
                      <span className="text-gfgk-text-2 truncate">{cat}</span>
                      <span className="font-mono-nums font-semibold text-gfgk-red-deep ml-2 whitespace-nowrap">{formatKr(amt)}</span>
                    </div>
                  ))}
                {Object.keys(kategorierUtgift).length === 0 && <p className="text-sm text-gfgk-text-3">Ingen data</p>}
              </div>
            </section>
          </div>
        </div>
    </>
  )
}
