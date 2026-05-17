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
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        copied
          ? 'bg-gfgk-teal-light text-gfgk-teal-deep'
          : 'bg-gfgk-gold text-gfgk-black hover:bg-gfgk-gold-deep'
      }`}
    >
      {copied ? 'Kopiert!' : 'Kopier lenke'}
    </button>
  )
}
