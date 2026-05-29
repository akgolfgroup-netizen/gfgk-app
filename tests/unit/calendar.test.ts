import { describe, expect, it } from 'vitest'
import {
  endOfMonth,
  endOfWeek,
  isoWeek,
  monthGrid,
  sameDay,
  shortWeekday,
  startOfMonth,
  startOfWeek,
  toDateString,
} from '@/lib/calendar'

describe('toDateString', () => {
  it('formaterer til YYYY-MM-DD', () => {
    expect(toDateString(new Date('2026-05-30T12:00:00Z'))).toBe('2026-05-30')
  })
})

describe('startOfWeek / endOfWeek', () => {
  it('starter uken på mandag', () => {
    // 2026-05-30 er en lørdag
    const sat = new Date(2026, 4, 30)
    const monday = startOfWeek(sat)
    expect(monday.getDay()).toBe(1) // mandag
    expect(monday.getDate()).toBe(25)
  })

  it('avslutter uken på søndag', () => {
    const sat = new Date(2026, 4, 30)
    const sunday = endOfWeek(sat)
    expect(sunday.getDay()).toBe(0) // søndag
    expect(sunday.getDate()).toBe(31)
  })

  it('mandag er sin egen ukestart', () => {
    const monday = new Date(2026, 4, 25)
    expect(startOfWeek(monday).getDate()).toBe(25)
  })
})

describe('startOfMonth / endOfMonth', () => {
  it('første og siste dag i mai', () => {
    const d = new Date(2026, 4, 15)
    expect(startOfMonth(d).getDate()).toBe(1)
    expect(endOfMonth(d).getDate()).toBe(31)
  })

  it('håndterer februar i skuddår', () => {
    const d = new Date(2028, 1, 10) // 2028 er skuddår
    expect(endOfMonth(d).getDate()).toBe(29)
  })
})

describe('monthGrid', () => {
  it('returnerer alltid 42 celler', () => {
    expect(monthGrid(2026, 5)).toHaveLength(42)
  })

  it('markerer dager utenfor måneden', () => {
    const cells = monthGrid(2026, 5)
    const inMonth = cells.filter((c) => c.inMonth)
    expect(inMonth).toHaveLength(31) // mai har 31 dager
  })

  it('første in-month-celle er 1. mai', () => {
    const cells = monthGrid(2026, 5)
    const first = cells.find((c) => c.inMonth)
    expect(first?.isoString).toBe('2026-05-01')
  })
})

describe('isoWeek', () => {
  it('beregner riktig ukenummer', () => {
    // 4. januar er alltid i uke 1
    expect(isoWeek(new Date(2026, 0, 4))).toBe(1)
  })
})

describe('sameDay', () => {
  it('matcher samme dato uavhengig av tid', () => {
    const a = new Date(2026, 4, 30, 8, 0)
    const b = new Date(2026, 4, 30, 22, 0)
    expect(sameDay(a, b)).toBe(true)
  })

  it('skiller ulike datoer', () => {
    expect(sameDay(new Date(2026, 4, 30), new Date(2026, 4, 31))).toBe(false)
  })
})

describe('shortWeekday', () => {
  it('returnerer norsk ukedag-prefiks', () => {
    expect(shortWeekday(new Date(2026, 4, 25))).toBe('man')
    expect(shortWeekday(new Date(2026, 4, 31))).toBe('son')
  })
})
