'use client'
import { useActionState } from 'react'
import { acceptInvite } from '@/lib/invite'

export function AcceptForm({ token }: { token: string }) {
  const action = acceptInvite.bind(null, token)
  const [error, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Navn</span>
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Passord</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Bekreft passord</span>
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-neutral-900 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? 'Oppretter...' : 'Opprett konto'}
      </button>
    </form>
  )
}
