'use client'

import {
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export interface AttachmentData {
  id: string
  blobUrl: string
  filename: string
  mimeType: string
  sizeBytes: number
}

interface AttachmentGridProps {
  attachments: AttachmentData[]
  onUpload: (formData: FormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/')
}
function isVideo(mime: string): boolean {
  return mime.startsWith('video/')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AttachmentGrid({ attachments, onUpload, onDelete }: AttachmentGridProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraFormRef = useRef<HTMLFormElement>(null)
  const fileFormRef = useRef<HTMLFormElement>(null)

  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {attachments.map((att) => (
            <AttachmentItem key={att.id} attachment={att} onDelete={onDelete} />
          ))}
        </div>
      )}

      <BottomSheet>
        <BottomSheetTrigger asChild>
          <Button variant="secondary" size="md" fullWidth>
            <Paperclip className="h-4 w-4" />
            Legg ved fil
          </Button>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetTitle>Legg til vedlegg</BottomSheetTitle>
          <div className="space-y-2">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => cameraRef.current?.click()}
            >
              <ImageIcon className="h-5 w-5" />
              Ta bilde
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="h-5 w-5" />
              Velg fil
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <form ref={cameraFormRef} action={onUpload} className="hidden">
        <input
          ref={cameraRef}
          name="file"
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={() => cameraFormRef.current?.requestSubmit()}
        />
      </form>
      <form ref={fileFormRef} action={onUpload} className="hidden">
        <input
          ref={fileRef}
          name="file"
          type="file"
          accept="image/*,video/*,application/pdf"
          onChange={() => fileFormRef.current?.requestSubmit()}
        />
      </form>
    </div>
  )
}

function AttachmentItem({
  attachment,
  onDelete,
}: {
  attachment: AttachmentData
  onDelete: (id: string) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDelete() {
    setConfirmOpen(false)
    startTransition(() => onDelete(attachment.id))
  }

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-gfgk-border bg-gfgk-cream-deep">
      <a
        href={attachment.blobUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full w-full"
        title={attachment.filename}
      >
        {isImage(attachment.mimeType) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.blobUrl}
            alt={attachment.filename}
            className="h-full w-full object-cover"
          />
        ) : isVideo(attachment.mimeType) ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gfgk-text-2">
            <Video className="h-8 w-8" strokeWidth={1.5} />
            <span className="px-2 text-center text-[10px] leading-tight">
              {attachment.filename.slice(0, 20)}
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gfgk-text-2">
            <FileText className="h-8 w-8" strokeWidth={1.5} />
            <span className="px-2 text-center text-[10px] leading-tight">
              {formatSize(attachment.sizeBytes)}
            </span>
          </div>
        )}
      </a>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        className={cn(
          // Synlig uten hover på touch (< sm); hover-fade kun ≥ sm.
          'absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-white',
          'opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100',
        )}
        aria-label="Slett vedlegg"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-black/60">
          {isPending ? (
            <X className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      <BottomSheet open={confirmOpen} onOpenChange={setConfirmOpen}>
        <BottomSheetContent>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gfgk-red-light text-gfgk-red-deep">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <BottomSheetTitle>Slette vedlegg</BottomSheetTitle>
              <BottomSheetDescription>
                {attachment.filename} blir slettet permanent.
              </BottomSheetDescription>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setConfirmOpen(false)}
            >
              Avbryt
            </Button>
            <Button
              type="button"
              variant="destructive"
              fullWidth
              onClick={handleDelete}
            >
              Slett
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  )
}
