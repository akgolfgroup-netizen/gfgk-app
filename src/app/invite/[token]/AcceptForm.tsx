'use client'
import { useActionState } from 'react'
import { acceptInvite } from '@/lib/invite'

export function AcceptForm({ token }: { token: string }) {
  const action = acceptInvite.bind(null, token)
  const [error, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-gfgk-text">Navn</span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-gfgk-text">Passord</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-gfgk-text">Bekreft passord</span>
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full"
        />
      </label>
      {error && (
        <p className="rounded-xl bg-gfgk-red-light px-4 py-3 text-sm text-gfgk-red-deep font-medium">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-gfgk-gold py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors disabled:opacity-50"
      >
        {pending ? 'Oppretter...' : 'Opprett konto'}
      </button>
    </form>
  )
}
