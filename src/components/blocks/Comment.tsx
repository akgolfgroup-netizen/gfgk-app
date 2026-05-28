'use client'

import { useTransition } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'

export interface CommentData {
  id: string
  body: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
}

interface CommentProps {
  comment: CommentData
  currentUserId: string
  onDelete?: (id: string) => Promise<void>
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'akkurat nå'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min siden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} t siden`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} dager siden`
  return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}

export function Comment({ comment, currentUserId, onDelete }: CommentProps) {
  const [isPending, startTransition] = useTransition()
  const mine = comment.author.id === currentUserId

  return (
    <div className={cn('flex gap-3', mine && 'flex-row-reverse')}>
      <Avatar
        size="md"
        src={comment.author.avatarUrl}
        name={comment.author.name}
        email={comment.author.email}
      />
      <div className={cn('flex min-w-0 flex-1 flex-col gap-1', mine && 'items-end')}>
        <div className={cn('flex items-center gap-2 text-xs text-gfgk-text-2', mine && 'flex-row-reverse')}>
          <span className="font-semibold text-gfgk-text">
            {comment.author.name ?? comment.author.email}
          </span>
          <span>·</span>
          <span>{timeAgo(comment.createdAt)}</span>
        </div>
        <div
          className={cn(
            'max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm',
            mine
              ? 'bg-gfgk-gold-light text-gfgk-text'
              : 'bg-gfgk-cream-deep text-gfgk-text',
          )}
        >
          {comment.body}
        </div>
        {mine && onDelete && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => onDelete(comment.id))}
            className="text-xs text-gfgk-text-3 hover:text-gfgk-red-deep disabled:opacity-50"
          >
            Slett
          </button>
        )}
      </div>
    </div>
  )
}
