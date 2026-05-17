import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 pt-safe pb-safe">
      <h1 className="text-3xl font-semibold tracking-tight">GFGK</h1>
      <p className="text-center text-sm text-neutral-600">AK Golf Group — mobile app</p>
      <Link
        href="/login"
        className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
      >
        Sign in
      </Link>
    </main>
  )
}
