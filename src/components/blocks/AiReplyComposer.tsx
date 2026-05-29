'use client'

import { RotateCcw, Send, UserCheck } from 'lucide-react'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'

interface AiReplyComposerProps {
  messageId: string
  initialDraft: string
  aiSkillUsed: string | null
  alreadySent: boolean
  onSend: (id: string, formData: FormData) => Promise<void>
  onRegenerate: (id: string) => Promise<void>
  onMarkManual: (id: string) => Promise<void>
}

export function AiReplyComposer({
  messageId,
  initialDraft,
  aiSkillUsed,
  alreadySent,
  onSend,
  onRegenerate,
  onMarkManual,
}: AiReplyComposerProps) {
  const [body, setBody] = useState(initialDraft)
  const [isPending, startTransition] = useTransition()

  if (alreadySent) {
    return (
      <div className="rounded-xl border border-gfgk-border bg-gfgk-cream-deep p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gfgk-teal-deep">
          Svar sendt
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gfgk-text">{initialDraft}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {aiSkillUsed && (
        <p className="text-xs text-gfgk-text-2">
          AI brukte mal: <strong>{aiSkillUsed}</strong>
        </p>
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        disabled={isPending}
        placeholder="Skriv svar..."
      />

      <div className="flex flex-wrap gap-2">
        <form
          action={(formData) => {
            startTransition(() => onSend(messageId, formData))
          }}
          className="flex-1"
        >
          <input type="hidden" name="body" value={body} />
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isPending || !body.trim()}
          >
            <Send className="h-4 w-4" />
            Send svar
          </Button>
        </form>

        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={isPending}
          onClick={() => startTransition(() => onRegenerate(messageId))}
        >
          <RotateCcw className="h-4 w-4" />
          Skriv om
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="md"
          disabled={isPending}
          onClick={() => startTransition(() => onMarkManual(messageId))}
        >
          <UserCheck className="h-4 w-4" />
          Manuell
        </Button>
      </div>
    </div>
  )
}
