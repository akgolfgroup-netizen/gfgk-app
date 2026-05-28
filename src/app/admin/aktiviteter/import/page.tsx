import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { importActivitiesCsv } from '@/lib/activities'

async function importAction(formData: FormData) {
  'use server'
  await importActivitiesCsv(formData)
  redirect('/admin/aktiviteter')
}

export default async function ImporterAktiviteterPage() {
  const session = await auth()
  if (!session?.user) return null

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Importer CSV"
          subtitle="Aktiviteter fra fil"
          back={{ href: '/admin/aktiviteter', label: 'Aktiviteter' }}
        />

        <div className="space-y-6 px-6 pt-6">
          <section>
            <SectionLabel>Format</SectionLabel>
            <Card padding="md">
              <p className="text-sm text-gfgk-text-2">
                CSV-fil med følgende kolonner (header på første linje):
              </p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-gfgk-cream-deep p-3 text-xs text-gfgk-text">
                {`title,type,start_at,end_at,location
"Klubbmesterskap",turnering,2026-06-15T08:00,2026-06-15T18:00,Banen
"Trener-samling",kurs,2026-07-01T09:00,2026-07-01T15:00,Klubbhuset`}
              </pre>
              <ul className="mt-3 space-y-1 text-xs text-gfgk-text-2">
                <li>
                  <strong>type:</strong> turnering | kurs | intern | sosial
                </li>
                <li>
                  <strong>start_at / end_at:</strong> ISO 8601 (YYYY-MM-DDTHH:MM)
                </li>
                <li>
                  <strong>location:</strong> valgfri
                </li>
              </ul>
            </Card>
          </section>

          <section>
            <SectionLabel>Last opp</SectionLabel>
            <Card padding="md">
              <form action={importAction} className="space-y-3">
                <input
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="block w-full rounded-xl border border-gfgk-border-strong bg-white px-4 py-3 text-sm text-gfgk-text file:mr-3 file:rounded-md file:border-0 file:bg-gfgk-gold file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-gfgk-black"
                />
                <Button type="submit" variant="primary" size="lg" fullWidth>
                  Importer
                </Button>
              </form>
            </Card>
          </section>
        </div>
      </main>
      <BottomNav role={session.user.role} />
    </>
  )
}
