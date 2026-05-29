import { Inbox } from 'lucide-react'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { InboxItem } from '@/components/blocks/InboxItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn } from '@/lib/cn'
import { listInbox } from '@/lib/inbox'
import type { InboxStatus } from '@/db/schema'

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

const FILTERS: Array<{ key: 'alle' | InboxStatus; label: string }> = [
  { key: 'alle', label: 'Alle' },
  { key: 'new', label: 'Nye' },
  { key: 'draft_ready', label: 'Utkast klart' },
  { key: 'sent', label: 'Sendt' },
  { key: 'manual', label: 'Manuell' },
  { key: 'archived', label: 'Arkivert' },
]

const VALID: InboxStatus[] = ['new', 'draft_ready', 'sent', 'manual', 'archived']

export default async function AdminInboxPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) return null

  const { filter } = await searchParams
  const status = filter && (VALID as string[]).includes(filter) ? (filter as InboxStatus) : undefined

  const messages = await listInbox({ status })

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Inbox"
          subtitle="servicepunkt@gfgk.no"
          back={{ href: '/admin', label: 'Admin' }}
        />

        <div className="space-y-4 px-6 pt-4">
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {FILTERS.map((f) => {
                const active = f.key === 'alle' ? !status : status === f.key
                const href =
                  f.key === 'alle' ? '/admin/inbox' : `/admin/inbox?filter=${f.key}`
                return (
                  <a
                    key={f.key}
                    href={href}
                    className={cn(
                      'inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold transition-colors',
                      active
                        ? 'bg-gfgk-gold text-gfgk-black'
                        : 'bg-gfgk-cream-deep text-gfgk-text hover:bg-gfgk-cream',
                    )}
                  >
                    {f.label}
                  </a>
                )
              })}
            </div>
          </div>

          {messages.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Ingen meldinger"
              description="Når noen sender e-post til servicepunkt@gfgk.no dukker meldingene opp her."
            />
          ) : (
            <div className="space-y-2">
              {messages.map((m) => (
                <InboxItem key={m.id} msg={m} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
