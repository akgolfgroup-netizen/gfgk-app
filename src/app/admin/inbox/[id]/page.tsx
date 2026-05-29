import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { AiReplyComposer } from '@/components/blocks/AiReplyComposer'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { ConfirmButton } from '@/components/ConfirmButton'
import type { InboxStatus } from '@/db/schema'
import { regenerateDraft } from '@/lib/ai-inbox'
import { archiveInboxMessage, getInboxMessage, markAsManual, sendInboxReply } from '@/lib/inbox'

interface PageProps {
  params: Promise<{ id: string }>
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

export default async function InboxDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) return null

  const { id } = await params
  const msg = await getInboxMessage(id)
  if (!msg) notFound()

  const alreadySent = msg.status === 'sent'

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title={msg.subject}
          subtitle={msg.fromName ? `${msg.fromName} <${msg.fromEmail}>` : msg.fromEmail}
          back={{ href: '/admin/inbox', label: 'Inbox' }}
          action={
            <Pill tone={STATUS_TONE[msg.status]} size="md">
              {STATUS_LABEL[msg.status]}
            </Pill>
          }
        />

        <div className="space-y-6 px-6 pt-6">
          {/* Original melding */}
          <section>
            <SectionLabel>Melding</SectionLabel>
            <Card padding="md" className="border-l-4 border-l-gfgk-text-3">
              <p className="text-xs text-gfgk-text-3">
                Mottatt{' '}
                {msg.receivedAt.toLocaleString('nb-NO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <div className="mt-3 whitespace-pre-wrap text-sm text-gfgk-text">
                {msg.bodyText ?? msg.bodyHtml?.replace(/<[^>]+>/g, ' ') ?? '(tomt innhold)'}
              </div>
            </Card>
          </section>

          {/* AI-utkast / send-svar */}
          <section>
            <SectionLabel>Svar</SectionLabel>
            <AiReplyComposer
              messageId={msg.id}
              initialDraft={msg.aiDraft ?? ''}
              aiSkillUsed={msg.aiSkillUsed}
              alreadySent={alreadySent}
              onSend={sendInboxReply}
              onRegenerate={regenerateDraft}
              onMarkManual={markAsManual}
            />
          </section>

          {/* Arkivér */}
          {!alreadySent && msg.status !== 'archived' && (
            <section>
              <form action={archiveInboxMessage.bind(null, msg.id)}>
                <ConfirmButton
                  message="Arkivere uten å svare?"
                  className="w-full rounded-lg border-2 border-gfgk-border bg-white px-4 py-2.5 text-sm font-semibold text-gfgk-text-2 hover:bg-gfgk-cream-deep"
                >
                  Arkivér
                </ConfirmButton>
              </form>
            </section>
          )}
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
