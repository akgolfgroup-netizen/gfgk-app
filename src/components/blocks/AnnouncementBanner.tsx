'use client'

import { Pin, X } from 'lucide-react'
import { useTransition } from 'react'

interface AnnouncementItem {
  id: string
  title: string
  body: string
  pinned: boolean
}

interface AnnouncementBannerProps {
  items: AnnouncementItem[]
  onDismiss: (id: string) => Promise<void>
}

export function AnnouncementBanner({ items, onDismiss }: AnnouncementBannerProps) {
  const [isPending, startTransition] = useTransition()

  if (items.length === 0) return null

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="overflow-hidden rounded-xl border border-gfgk-gold-deep bg-gfgk-gold-light p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                {item.pinned && (
                  <Pin className="h-3.5 w-3.5 text-gfgk-gold-deep" strokeWidth={2.5} />
                )}
                <h3 className="text-sm font-bold text-gfgk-text">{item.title}</h3>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gfgk-text-2">{item.body}</p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => onDismiss(item.id))}
              className="shrink-0 rounded-md p-1 text-gfgk-text-2 hover:bg-gfgk-cream-deep disabled:opacity-50"
              aria-label="Lukk"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
