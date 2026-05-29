'use client'

import { Eye, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/cn'
import { MarkdownView } from './MarkdownView'

interface MarkdownEditorProps {
  name: string
  defaultValue?: string
  rows?: number
  required?: boolean
  placeholder?: string
}

export function MarkdownEditor({
  name,
  defaultValue = '',
  rows = 12,
  required,
  placeholder,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 rounded-lg bg-gfgk-cream-deep p-0.5">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
            mode === 'edit'
              ? 'bg-white text-gfgk-text shadow-sm'
              : 'text-gfgk-text-2 hover:text-gfgk-text',
          )}
        >
          <Pencil className="h-3.5 w-3.5" />
          Rediger
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
            mode === 'preview'
              ? 'bg-white text-gfgk-text shadow-sm'
              : 'text-gfgk-text-2 hover:text-gfgk-text',
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Forhåndsvis
        </button>
      </div>

      {mode === 'edit' ? (
        <Textarea
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={rows}
          required={required}
          placeholder={placeholder}
          className="font-mono text-sm"
        />
      ) : (
        <>
          <input type="hidden" name={name} value={value} />
          <div className="min-h-[200px] rounded-xl border border-gfgk-border bg-white p-4">
            {value.trim() ? (
              <MarkdownView content={value} />
            ) : (
              <p className="text-sm italic text-gfgk-text-3">
                Ingenting å vise enda. Bytt til Rediger og skriv noe.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
