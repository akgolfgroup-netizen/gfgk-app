import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { PushManager } from '@/components/blocks/PushManager'
import { Card } from '@/components/ui/Card'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SubHeader } from '@/components/ui/SubHeader'

export default async function VarslerPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <AppShell role={session.user.role} userName={session.user.name ?? null}>
        <SubHeader
          title="Varsler"
          subtitle="Push-varsler til denne enheten"
          back={{ href: '/profil', label: 'Profil' }}
          maxWidth="3xl"
        />

        <div className="space-y-6 px-6 pt-6 lg:mx-auto lg:max-w-3xl">
          <section>
            <SectionLabel>Push-varsler</SectionLabel>
            <Card padding="md">
              <PushManager />
            </Card>
            <p className="mt-3 text-xs text-gfgk-text-2">
              Du får varsel når du tildeles en oppgave, når vaktlister publiseres,
              ved nye beskjeder, og når ferie godkjennes.
            </p>
          </section>
        </div>
    </AppShell>
  )
}
