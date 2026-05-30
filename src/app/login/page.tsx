import { ChevronLeft } from 'lucide-react'
import { AuthError } from 'next-auth'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { Button } from '@/components/ui/Button'

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
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 pt-safe pb-safe">
      <Link
        href="/"
        className="-ml-0.5 mb-8 inline-flex h-9 w-fit items-center gap-1 rounded-full border border-gfgk-border bg-white pl-2 pr-3.5 text-sm font-semibold text-gfgk-text shadow-card transition-colors hover:bg-gfgk-cream-deep"
      >
        <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.5} />
        Tilbake
      </Link>

      <div className="mb-7 flex items-center gap-3">
        <div className="surface-gold-soft grid h-12 w-12 place-items-center overflow-hidden rounded-2xl">
          <Image src="/logo.png" alt="GFGK" width={36} height={36} priority />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gfgk-text">
            Logg inn
          </h1>
          <p className="text-[13px] text-gfgk-text-2">Gamle Fredrikstad Golfklubb</p>
        </div>
      </div>

      {invited && (
        <p className="mb-4 rounded-xl bg-gfgk-teal-light px-4 py-3 text-sm font-medium text-gfgk-teal-deep">
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
        <Button type="submit" size="lg" fullWidth>
          Logg inn
        </Button>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-gfgk-red-light px-4 py-3 text-sm font-medium text-gfgk-red-deep"
          >
            {error === 'CredentialsSignin'
              ? 'Feil e-post eller passord.'
              : 'Innloggingsfeil.'}
          </p>
        )}
      </form>
    </main>
  )
}
