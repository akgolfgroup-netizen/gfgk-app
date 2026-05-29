'use client'

import { FileText, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Pill } from '@/components/ui/Pill'

interface DocumentCardProps {
  doc: {
    id: string
    name: string
    blobUrl: string
    mimeType: string
    sizeBytes: number
    category: string
    uploadedAt: Date
    expiresAt: string | null
  }
  canDelete: boolean
  onDelete?: (id: string) => Promise<void>
}

const CATEGORY_LABEL: Record<string, string> = {
  kontrakt: 'Kontrakt',
  ferieattest: 'Ferieattest',
  sykmelding: 'Sykmelding',
  kvittering: 'Kvittering',
  annet: 'Annet',
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function daysUntil(date: string): number {
  const d = new Date(date + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function DocumentCard({ doc, canDelete, onDelete }: DocumentCardProps) {
  const [, startTransition] = useTransition()
  const isImage = doc.mimeType.startsWith('image/')
  const Icon = isImage ? ImageIcon : FileText

  const expirySoon = doc.expiresAt ? daysUntil(doc.expiresAt) <= 30 : false
  const expired = doc.expiresAt ? daysUntil(doc.expiresAt) < 0 : false

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gfgk-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,.06)]">
      <a
        href={doc.blobUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gfgk-cream-deep text-gfgk-text-2 transition-colors hover:bg-gfgk-cream"
      >
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </a>

      <div className="min-w-0 flex-1">
        <a
          href={doc.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-semibold text-gfgk-text hover:underline"
        >
          <span className="truncate">{doc.name}</span>
        </a>
        <div className="mt-1 flex items-center gap-2 text-xs text-gfgk-text-2">
          <span>{CATEGORY_LABEL[doc.category] ?? 'Annet'}</span>
          <span>·</span>
          <span>{formatSize(doc.sizeBytes)}</span>
        </div>
        {doc.expiresAt && (
          <div className="mt-1.5">
            {expired ? (
              <Pill tone="red" size="sm">
                Utløpt
              </Pill>
            ) : expirySoon ? (
              <Pill tone="red" size="sm">
                Utløper om {daysUntil(doc.expiresAt)} dager
              </Pill>
            ) : (
              <span className="text-xs text-gfgk-text-3">
                Utløper {new Date(doc.expiresAt + 'T00:00:00').toLocaleDateString('nb-NO')}
              </span>
            )}
          </div>
        )}
      </div>

      {canDelete && onDelete && (
        <form
          action={() => {
            startTransition(() => onDelete(doc.id))
          }}
        >
          <ConfirmButton
            message={`Slette "${doc.name}"?`}
            className="rounded-md p-2 text-gfgk-text-3 hover:bg-gfgk-red-light hover:text-gfgk-red-deep"
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
        </form>
      )}
    </div>
  )
}
