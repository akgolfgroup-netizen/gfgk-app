import { and, asc, gte, lte } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { transactions } from '@/db/schema'

function escape(value: string | number | null) {
  if (value == null) return ''
  const str = String(value)
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export async function GET(req: Request) {
  const session = await auth()
  if (session?.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const now = new Date()
  const fromDate = from ?? `${now.getFullYear()}-01-01`
  const toDate = to ?? `${now.getFullYear()}-12-31`

  const rows = await getDb()
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, fromDate), lte(transactions.date, toDate)))
    .orderBy(asc(transactions.date))

  const header = ['Dato', 'Type', 'Kategori', 'Beløp', 'Beskrivelse'].join(';')
  const lines = rows.map((r) =>
    [r.date, r.type, r.category, r.amount, r.description ?? ''].map(escape).join(';'),
  )
  const csv = '﻿' + [header, ...lines].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gfgk-rapport-${fromDate}_${toDate}.csv"`,
    },
  })
}
