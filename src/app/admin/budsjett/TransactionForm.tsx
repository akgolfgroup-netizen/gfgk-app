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
    <form action={createTransaction} className="space-y-4 rounded-lg border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
      <div className="grid grid-cols-2 gap-2">
        {(['inntekt', 'utgift'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-md py-2.5 text-sm font-bold capitalize transition-colors ${
              type === t
                ? t === 'inntekt'
                  ? 'bg-gfgk-teal-light text-gfgk-teal-deep'
                  : 'bg-gfgk-red-light text-gfgk-red-deep'
                : 'border border-gfgk-border text-gfgk-text-2 hover:bg-gfgk-cream-deep'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-gfgk-text">Beløp (kr)</span>
        <input
          name="amount"
          type="number"
          required
          min="1"
          inputMode="numeric"
          className="w-full"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-gfgk-text">Kategori</span>
        <select name="category" className="w-full">
          {KATEGORIER[type].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-gfgk-text">Dato</span>
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultDate}
          className="w-full"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-gfgk-text">Beskrivelse (valgfritt)</span>
        <input name="description" type="text" className="w-full" />
      </label>

      <button
        type="submit"
        className="w-full rounded-md bg-gfgk-gold py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors"
      >
        Legg til
      </button>
    </form>
  )
}
