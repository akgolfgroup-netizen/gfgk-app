'use client'

import { Clock, LogIn, LogOut } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

interface ClockButtonProps {
  isClockedIn: boolean
  clockedInAt: Date | null
  todayShift: {
    startTime: string
    endTime: string
  } | null
  onClockIn: () => Promise<void>
  onClockOut: () => Promise<void>
}

function formatDuration(from: Date): string {
  const totalSec = Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function ClockButton({
  isClockedIn,
  clockedInAt,
  todayShift,
  onClockIn,
  onClockOut,
}: ClockButtonProps) {
  const [, startTransition] = useTransition()
  const [tick, setTick] = useState(0)

  // Live timer (oppdater hvert sekund når innstemplet)
  useEffect(() => {
    if (!isClockedIn || !clockedInAt) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [isClockedIn, clockedInAt])

  // Force re-render via tick — bruk variabelen for å unngå unused-warning
  void tick

  if (isClockedIn && clockedInAt) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gfgk-border bg-gfgk-black p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold">
            Innstemplet
          </span>
          <Clock className="h-4 w-4 text-gfgk-gold" strokeWidth={2.5} />
        </div>
        <p className="font-mono text-4xl font-extrabold text-gfgk-gold tabular-nums">
          {formatDuration(clockedInAt)}
        </p>
        <p className="mt-1 text-xs text-white/60">
          Startet kl{' '}
          {clockedInAt.toLocaleTimeString('nb-NO', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <form
          action={() => {
            startTransition(() => onClockOut())
          }}
          className="mt-4"
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            className="!bg-gfgk-gold !text-gfgk-black"
          >
            <LogOut className="h-5 w-5" />
            Stempel ut
          </Button>
        </form>
      </div>
    )
  }

  // Ikke innstemplet
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-gfgk-border bg-white p-5 shadow-sm',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gfgk-gold-deep">
          {todayShift ? 'Vakt i dag' : 'Klar til å starte'}
        </span>
        <Clock className="h-4 w-4 text-gfgk-text-2" strokeWidth={2.5} />
      </div>
      {todayShift ? (
        <p className="text-2xl font-extrabold text-gfgk-text">
          {todayShift.startTime}
          <span className="mx-2 text-gfgk-text-3">–</span>
          {todayShift.endTime}
        </p>
      ) : (
        <p className="text-sm text-gfgk-text-2">Du har ingen publisert vakt i dag.</p>
      )}
      <form
        action={() => {
          startTransition(() => onClockIn())
        }}
        className="mt-4"
      >
        <Button type="submit" variant="primary" size="lg" fullWidth>
          <LogIn className="h-5 w-5" />
          Stempel inn
        </Button>
      </form>
    </div>
  )
}
