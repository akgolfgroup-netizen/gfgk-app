import Link from 'next/link'
import { and, asc, gte, lte } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { transactions } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { toDateString } from '@/lib/dates'
import { ConfirmButton } from '@/components/ConfirmButton'
import { deleteTransaction } from '@/lib/transactions'
import { TransactionForm } from './TransactionForm'

function formatKr(amount: number) {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(amount)
}

function prevMonth(year: number, month: number) {
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(year: number, month: number) {
  const d = new Date(year, month, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function BudsjettPage({
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
  const lastDay = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('nb-NO', {
    month: 'long',
    year: 'numeric',
  })

  const rows = await getDb()
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, monthStart), lte(transactions.date, monthEnd)))
    .orderBy(asc(transactions.date))

  const totalInntekt = rows.filter((r) => r.type === 'inntekt').reduce((s, r) => s + r.amount, 0)
  const totalUtgift = rows.filter((r) => r.type === 'utgift').reduce((s, r) => s + r.amount, 0)
  const resultat = totalInntekt - totalUtgift

  const byDate = new Map<string, typeof rows>()
  for (const row of [...rows].reverse()) {
    const existing = byDate.get(row.date) ?? []
    byDate.set(row.date, [...existing, row])
  }

  const today = toDateString(now)

  return (
    <>
      <main className="min-h-dvh pb-24">
        <header className="bg-gfgk-black px-6 pt-safe pb-6">
          <div className="pt-4">
            <a href="/admin" className="text-sm text-white/50 hover:text-white/80 transition-colors">
              ← Admin
            </a>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gfgk-gold">Budsjett</h1>
          </div>
        </header>

        <div className="px-6 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={`/admin/budsjett?mnd=${prevMonth(year, month)}`}
              className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-[0_1px_2px_rgba(0,0,0,.06)]"
            >
              ←
            </Link>
            <span className="text-sm font-bold capitalize text-gfgk-text">{monthLabel}</span>
            <Link
              href={`/admin/budsjett?mnd=${nextMonth(year, month)}`}
              className="rounded-md border border-gfgk-border bg-white px-4 py-2 text-sm font-medium text-gfgk-text hover:bg-gfgk-cream-deep transition-colors shadow-[0_1px_2px_rgba(0,0,0,.06)]"
            >
              →
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-3">
            <div className="overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <div className="bg-gfgk-teal-light px-3 py-2 text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gfgk-teal-deep">Inntekter</p>
              </div>
              <div className="bg-white px-3 py-2 text-center">
                <p className="text-sm font-bold text-gfgk-teal-deep">{formatKr(totalInntekt)}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <div className="bg-gfgk-red-light px-3 py-2 text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gfgk-red-deep">Utgifter</p>
              </div>
              <div className="bg-white px-3 py-2 text-center">
                <p className="text-sm font-bold text-gfgk-red-deep">{formatKr(totalUtgift)}</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-gfgk-border shadow-[0_1px_2px_rgba(0,0,0,.06)]">
              <div className="bg-gfgk-black px-3 py-2 text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-gfgk-gold">Resultat</p>
              </div>
              <div className="bg-white px-3 py-2 text-center">
                <p className={`text-sm font-bold ${resultat >= 0 ? 'text-gfgk-teal-deep' : 'text-gfgk-red-deep'}`}>
                  {formatKr(resultat)}
                </p>
              </div>
            </div>
          </div>

          {byDate.size > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
                <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
                Transaksjoner ({rows.length})
              </h2>
              <div className="space-y-4">
                {Array.from(byDate.entries()).map(([date, dateRows]) => (
                  <div key={date}>
                    <p className="mb-2 text-xs font-medium text-gfgk-text-2">
                      {new Date(date + 'T00:00:00').toLocaleDateString('nb-NO', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <div className="space-y-2">
                      {dateRows.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-lg border border-gfgk-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.06)] hover:bg-gfgk-gold-light transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gfgk-text">
                              {tx.category}
                              {tx.description ? ` · ${tx.description}` : ''}
                            </p>
                            <p
                              className={`text-sm font-bold ${tx.type === 'inntekt' ? 'text-gfgk-teal-deep' : 'text-gfgk-red-deep'}`}
                            >
                              {tx.type === 'inntekt' ? '+' : '−'} {formatKr(tx.amount)}
                            </p>
                          </div>
                          <form action={deleteTransaction.bind(null, tx.id)}>
                            <ConfirmButton
                              message="Slette denne transaksjonen?"
                              className="rounded-md border border-gfgk-red/30 bg-gfgk-red-light px-3 py-1 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20 transition-colors"
                            >
                              Slett
                            </ConfirmButton>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
              <span className="inline-block h-3.5 w-0.5 rounded-full bg-gfgk-gold" />
              Ny transaksjon
            </h2>
            <TransactionForm defaultDate={today} />
          </section>
        </div>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
