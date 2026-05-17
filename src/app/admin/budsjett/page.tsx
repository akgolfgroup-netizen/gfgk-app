import Link from 'next/link'
import { and, asc, gte, lte } from 'drizzle-orm'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { transactions } from '@/db/schema'
import { BottomNav } from '@/components/BottomNav'
import { toDateString } from '@/lib/dates'
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

  // Group by date descending
  const byDate = new Map<string, typeof rows>()
  for (const row of [...rows].reverse()) {
    const existing = byDate.get(row.date) ?? []
    byDate.set(row.date, [...existing, row])
  }

  const today = toDateString(now)

  return (
    <>
      <main className="min-h-dvh px-6 pt-safe pb-24">
        <header className="py-6">
          <a href="/admin" className="text-sm text-neutral-500">
            ← Admin
          </a>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Budsjett</h1>
        </header>

        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/admin/budsjett?mnd=${prevMonth(year, month)}`}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm"
          >
            ←
          </Link>
          <span className="text-sm font-medium capitalize">{monthLabel}</span>
          <Link
            href={`/admin/budsjett?mnd=${nextMonth(year, month)}`}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm"
          >
            →
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-green-50 p-3 text-center">
            <p className="text-xs text-green-700">Inntekter</p>
            <p className="mt-1 text-sm font-semibold text-green-900">{formatKr(totalInntekt)}</p>
          </div>
          <div className="rounded-2xl bg-red-50 p-3 text-center">
            <p className="text-xs text-red-700">Utgifter</p>
            <p className="mt-1 text-sm font-semibold text-red-900">{formatKr(totalUtgift)}</p>
          </div>
          <div
            className={`rounded-2xl p-3 text-center ${resultat >= 0 ? 'bg-neutral-100' : 'bg-orange-50'}`}
          >
            <p className={`text-xs ${resultat >= 0 ? 'text-neutral-600' : 'text-orange-700'}`}>
              Resultat
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${resultat >= 0 ? 'text-neutral-900' : 'text-orange-900'}`}
            >
              {formatKr(resultat)}
            </p>
          </div>
        </div>

        {byDate.size > 0 && (
          <section className="mb-8 space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Transaksjoner ({rows.length})
            </h2>
            {Array.from(byDate.entries()).map(([date, dateRows]) => (
              <div key={date}>
                <p className="mb-2 text-xs text-neutral-400">
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
                      className="flex items-center justify-between rounded-2xl border border-neutral-200 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {tx.category}
                          {tx.description ? ` · ${tx.description}` : ''}
                        </p>
                        <p
                          className={`text-sm font-semibold ${tx.type === 'inntekt' ? 'text-green-700' : 'text-red-700'}`}
                        >
                          {tx.type === 'inntekt' ? '+' : '−'} {formatKr(tx.amount)}
                        </p>
                      </div>
                      <form action={deleteTransaction.bind(null, tx.id)}>
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
              </div>
            ))}
          </section>
        )}

        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Ny transaksjon
          </h2>
          <TransactionForm defaultDate={today} />
        </section>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
