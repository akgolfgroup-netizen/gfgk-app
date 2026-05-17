import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'

export default async function AdminPage() {
  const session = await auth()
  return (
    <>
      <main className="min-h-dvh px-6 pt-safe pb-24">
        <header className="py-6">
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-neutral-600">Internt panel for daglig leder</p>
        </header>
        <section className="space-y-3">
          <div className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-base font-medium">Ansatte</h2>
            <p className="text-sm text-neutral-600">Inviter og administrer ansatte. Kommer i M2.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-base font-medium">Vaktliste</h2>
            <p className="text-sm text-neutral-600">Lag og publiser vaktlister. Kommer i M3.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-base font-medium">Budsjett</h2>
            <p className="text-sm text-neutral-600">Inntekter, utgifter og rapporter. Kommer i M4.</p>
          </div>
        </section>
      </main>
      <BottomNav role={session!.user.role} />
    </>
  )
}
