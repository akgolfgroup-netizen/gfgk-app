'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseInlineEditOptions {
  initialValue: string
  onSave: (value: string) => Promise<void> | void
  multiline?: boolean
}

/**
 * Notion-stil inline-edit hook. Blur lagrer, Esc avbryter, Enter lagrer (single-line).
 * Multiline: Enter lager newline, Cmd+Enter lagrer, Esc avbryter.
 *
 * For å koble til input/textarea, bruk `attachRef` som callback ref:
 *   <input ref={attachRef} value={value} ... />
 */
export function useInlineEdit({
  initialValue,
  onSave,
  multiline = false,
}: UseInlineEditOptions) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [isPending, setIsPending] = useState(false)
  const [savedValue, setSavedValue] = useState(initialValue)
  const [lastSeenInitial, setLastSeenInitial] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  // Sync når props endres utenfra (etter revalidatePath) — derive-pattern
  if (!editing && initialValue !== lastSeenInitial) {
    setLastSeenInitial(initialValue)
    setValue(initialValue)
    setSavedValue(initialValue)
  }

  // Fokuser og marker tekst når vi går inn i edit-mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if ('select' in inputRef.current) inputRef.current.select()
    }
  }, [editing])

  const startEdit = useCallback(() => setEditing(true), [])

  const cancelEdit = useCallback(() => {
    setValue(savedValue)
    setEditing(false)
  }, [savedValue])

  const save = useCallback(async () => {
    const trimmed = value.trim()
    if (trimmed === savedValue) {
      setEditing(false)
      return
    }
    setIsPending(true)
    try {
      await onSave(trimmed)
      setSavedValue(trimmed)
    } catch (err) {
      console.error('[useInlineEdit] save failed:', err)
      setValue(savedValue)
    } finally {
      setIsPending(false)
      setEditing(false)
    }
  }, [value, savedValue, onSave])

  const handleBlur = useCallback(() => {
    void save()
  }, [save])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelEdit()
        return
      }
      if (e.key === 'Enter') {
        if (multiline && !e.metaKey && !e.ctrlKey) {
          // Single Enter = newline i multiline
          return
        }
        e.preventDefault()
        void save()
      }
    },
    [cancelEdit, save, multiline],
  )

  const attachRef = useCallback((el: HTMLInputElement | HTMLTextAreaElement | null) => {
    inputRef.current = el
  }, [])

  return {
    value,
    editing,
    isPending,
    startEdit,
    cancelEdit,
    setValue,
    handleBlur,
    handleKeyDown,
    attachRef,
  }
}
