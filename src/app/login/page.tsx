import { ChevronLeft } from 'lucide-react'
import { AuthError } from 'next-auth'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { SubmitButton } from '@/components/ui/SubmitButton'

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
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Foto-hero */}
      <Image
        src="/login-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/85" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col px-6 pt-safe pb-safe">
        {/* Tilbake */}
        <div className="pt-4">
          <Link
            href="/"
            className="-ml-0.5 inline-flex h-9 items-center gap-1 rounded-full bg-white/15 pl-2 pr-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.5} />
            Tilbake
          </Link>
        </div>

        {/* Hero-tekst */}
        <div className="flex flex-1 flex-col justify-center gap-5">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg">
            <Image
              src="/logo.png"
              alt="GFGK"
              width={52}
              height={52}
              priority
              className="h-12 w-12 object-contain"
            />
          </div>
          <div>
            <h1 className="h-display text-[40px] leading-[1.04] text-white">
              Velkommen{' '}
              <span className="font-normal italic text-gfgk-gold">tilbake</span>
            </h1>
            <p className="mt-1.5 text-[15px] text-white/80">
              Gamle Fredrikstad Golfklubb
            </p>
          </div>
        </div>

        {/* Skjema-kort */}
        <div className="rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur">
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
            <SubmitButton size="lg" fullWidth pendingText="Logger inn …">
              Logg inn
            </SubmitButton>
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
        </div>
      </div>
    </main>
  )
}
