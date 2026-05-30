/**
 * Date-utils for kalender-visninger. Norske ukedager (mandag = uke-start).
 */

export const WEEKDAYS_NB = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'] as const
export const MONTHS_NB = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
] as const

export function toDateString(d: Date): string {
  // Lokal-basert (ikke UTC) — ellers forskyves kalenderdatoer i tidssoner øst for UTC.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Få mandag som start av uken for en dato (lokal tid).
 */
export function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7 // Man = 0
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  out.setDate(out.getDate() - day)
  return out
}

export function endOfWeek(d: Date): Date {
  const start = startOfWeek(d)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1)
}

export function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
}

/**
 * Bygg liste over dager i en uke (man-søn), inkludert datoer.
 */
export function daysInWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

/**
 * ISO uke-nummer.
 */
export function isoWeek(d: Date): number {
  const target = new Date(d.valueOf())
  const dayNr = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000
  return 1 + Math.round((diff - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}

/**
 * Returner dager i måned-grid (alltid 6 uker = 42 celler) med leading/trailing days.
 */
export interface MonthCell {
  date: Date
  inMonth: boolean
  isoString: string
}

export function monthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month - 1, 1)
  const firstWeekday = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - firstWeekday)

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return {
      date,
      inMonth: date.getMonth() === month - 1,
      isoString: toDateString(date),
    }
  })
}

/**
 * Flytt en referansedato med ±1 periode for kalender-navigasjon.
 * For måneds-visning hopper vi hele måneder og klamper dagnummeret til
 * måltidens lengde (31. mai − 1 mnd → 30. april, ikke 1. mai).
 */
export function shiftPeriod(
  ref: Date,
  view: 'dag' | 'uke' | 'maned' | 'ar',
  dir: -1 | 1,
): Date {
  const out = new Date(ref)
  if (view === 'dag') {
    out.setDate(out.getDate() + dir)
  } else if (view === 'uke') {
    out.setDate(out.getDate() + dir * 7)
  } else if (view === 'ar') {
    out.setFullYear(out.getFullYear() + dir)
  } else {
    const day = out.getDate()
    out.setDate(1) // unngå roll-over før vi bytter måned
    out.setMonth(out.getMonth() + dir)
    const lastDay = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate()
    out.setDate(Math.min(day, lastDay))
  }
  return out
}

export function formatNorwegianMonthYear(d: Date): string {
  return `${MONTHS_NB[d.getMonth()]} ${d.getFullYear()}`
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Norsk ukedag-prefiks (man, tir, ...) fra Date-objekt.
 */
export function shortWeekday(d: Date): string {
  return ['son', 'man', 'tir', 'ons', 'tor', 'fre', 'lor'][d.getDay()] ?? 'man'
}
