'use client'
import { useState } from 'react'
import { createTransaction } from '@/lib/transactions'

const KATEGORIER = {
  inntekt: ['Greenfee', 'Medlemskap', 'Butikk', 'Kafe', 'Baneleie', 'Arrangement', 'Annet'],
  utgift: ['Lønn', 'Vedlikehold', 'Utstyr', 'Forbruksmateriell', 'Strøm', 'Forsikring', 'Administrasjon', 'Annet'],
}

export function TransactionForm({ defaultDate }: { defaultDate: string }) {
  const [type, setType] = useState<'inntekt' | 'utgift'>('inntekt')

  return (
    <form action={createTransaction} className="space-y-4 rounded-2xl border border-neutral-200 p-4">
      <div className="grid grid-cols-2 gap-2">
        {(['inntekt', 'utgift'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl py-2.5 text-sm font-medium capitalize transition-colors ${
              type === t
                ? t === 'inntekt'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                : 'border border-neutral-200 text-neutral-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <label className="block space-y-2">
        <span className="text-sm font-medium">Beløp (kr)</span>
        <input
          name="amount"
          type="number"
          required
          min="1"
          inputMode="numeric"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Kategori</span>
        <select
          name="category"
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-neutral-900"
        >
          {KATEGORIER[type].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Dato</span>
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultDate}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Beskrivelse (valgfritt)</span>
        <input
          name="description"
          type="text"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-full bg-neutral-900 py-3 text-sm font-medium text-white"
      >
        Legg til
      </button>
    </form>
  )
}
