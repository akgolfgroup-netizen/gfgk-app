import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'

async function loginAction(formData: FormData) {
  'use server'
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/dashboard',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${error.type}`)
    }
    throw error
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string }>
}) {
  const params = await searchParams
  const { error } = params
  const invited = 'invited' in params
  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 pt-safe pb-safe">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-gfgk-text">Logg inn</h1>
          <p className="text-sm text-gfgk-text-2">GFGK — Gamle Fredrikstad Golfklubb</p>
        </div>
        {invited && (
          <p className="rounded-xl bg-gfgk-teal-light px-4 py-3 text-sm text-gfgk-teal-deep font-medium">
            Kontoen er opprettet! Logg inn under.
          </p>
        )}
        <form action={loginAction} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-gfgk-text">E-post</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              className="w-full"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-gfgk-text">Passord</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-gfgk-gold py-3 text-sm font-bold text-gfgk-black hover:bg-gfgk-gold-deep transition-colors"
          >
            Logg inn
          </button>
          {error && (
            <p className="rounded-xl bg-gfgk-red-light px-4 py-3 text-sm text-gfgk-red-deep font-medium">
              {error === 'CredentialsSignin' ? 'Feil e-post eller passord.' : 'Innloggingsfeil.'}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
