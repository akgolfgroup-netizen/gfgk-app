'use client'
import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium"
    >
      {copied ? 'Kopiert!' : 'Kopier lenke'}
    </button>
  )
}
