import { Inbox } from 'lucide-react'
import { auth } from '@/auth'
import { InboxItem } from '@/components/blocks/InboxItem'
import { Chip, ChipBar } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
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
        <PageHeader
          title="Inbox"
          subtitle="servicepunkt@gfgk.no"
          back={{ href: '/admin', label: 'Admin' }}
        />

        <div className="space-y-4 px-6 pt-4">
          <ChipBar>
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                active={f.key === 'alle' ? !status : status === f.key}
                href={f.key === 'alle' ? '/admin/inbox' : `/admin/inbox?filter=${f.key}`}
              >
                {f.label}
              </Chip>
            ))}
          </ChipBar>

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
    </>
  )
}
