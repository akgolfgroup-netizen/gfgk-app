import Link from 'next/link'
import { Pill } from '@/components/ui/Pill'
import { cn } from '@/lib/cn'
import type { InboxStatus } from '@/db/schema'

interface InboxItemProps {
  msg: {
    id: string
    fromName: string | null
    fromEmail: string
    subject: string
    receivedAt: Date
    status: InboxStatus
  }
}

const STATUS_LABEL: Record<InboxStatus, string> = {
  new: 'Ny',
  draft_ready: 'Utkast klart',
  sent: 'Sendt',
  manual: 'Manuell',
  archived: 'Arkivert',
}

const STATUS_TONE: Record<InboxStatus, 'gold' | 'teal' | 'red' | 'neutral'> = {
  new: 'gold',
  draft_ready: 'teal',
  sent: 'neutral',
  manual: 'neutral',
  archived: 'neutral',
}

const STATUS_ACCENT: Record<InboxStatus, string> = {
  new: 'border-l-gfgk-gold',
  draft_ready: 'border-l-gfgk-teal',
  sent: 'border-l-gfgk-text-3',
  manual: 'border-l-gfgk-text-3',
  archived: 'border-l-gfgk-text-3',
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} t`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d`
  return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}

export function InboxItem({ msg }: InboxItemProps) {
  return (
    <Link
      href={`/admin/inbox/${msg.id}`}
      className={cn(
        'block rounded-xl border border-gfgk-border border-l-4 bg-white p-3 shadow-card transition-colors hover:bg-gfgk-cream-deep',
        STATUS_ACCENT[msg.status],
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-gfgk-text">
          {msg.fromName ?? msg.fromEmail}
        </p>
        <span className="font-mono-nums shrink-0 text-xs text-gfgk-text-3">
          {timeAgo(msg.receivedAt)}
        </span>
      </div>
      <p
        className={cn(
          'truncate text-sm text-gfgk-text',
          msg.status === 'new' && 'font-semibold',
        )}
      >
        {msg.subject}
      </p>
      <div className="mt-1.5">
        <Pill tone={STATUS_TONE[msg.status]} size="sm">
          {STATUS_LABEL[msg.status]}
        </Pill>
      </div>
    </Link>
  )
}
