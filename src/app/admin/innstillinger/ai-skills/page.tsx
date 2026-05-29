import { Lightbulb, Plus } from 'lucide-react'
import { auth } from '@/auth'
import { BottomNav } from '@/components/BottomNav'
import { ConfirmButton } from '@/components/ConfirmButton'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Textarea } from '@/components/ui/Textarea'
import { createInboxSkill, deleteInboxSkill, listInboxSkills } from '@/lib/inbox'

export default async function AiSkillsPage() {
  const session = await auth()
  if (!session?.user) return null

  const skills = await listInboxSkills()

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="AI svar-maler"
          subtitle="Skills som agenten bruker"
          back={{ href: '/admin', label: 'Admin' }}
        />

        <div className="px-6 pt-6">
          {skills.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Ingen svar-maler enda"
              description="Lag maler for vanlige spørsmål (medlemskap, baneinfo, etc.). Agenten bruker dem automatisk."
            />
          ) : (
            <div className="space-y-3">
              {skills.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-gfgk-border bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gfgk-text">{s.name}</h3>
                      <p className="text-xs text-gfgk-text-2">{s.description}</p>
                    </div>
                    <form action={deleteInboxSkill.bind(null, s.id)}>
                      <ConfirmButton
                        message={`Slette mal "${s.name}"?`}
                        className="rounded-md bg-gfgk-red-light px-3 py-1.5 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20"
                      >
                        Slett
                      </ConfirmButton>
                    </form>
                  </div>
                  <details className="text-sm text-gfgk-text-2">
                    <summary className="cursor-pointer text-xs font-semibold text-gfgk-gold-deep">
                      Vis instruksjon
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded-md bg-gfgk-cream-deep p-2 text-xs">
                      {s.prompt}
                    </pre>
                    {s.exampleResponse && (
                      <>
                        <p className="mt-2 text-xs font-semibold text-gfgk-gold-deep">
                          Eksempel-svar
                        </p>
                        <pre className="mt-1 whitespace-pre-wrap rounded-md bg-gfgk-cream-deep p-2 text-xs">
                          {s.exampleResponse}
                        </pre>
                      </>
                    )}
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomSheet>
        <BottomSheetTrigger asChild>
          <FAB aria-label="Ny mal">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </FAB>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetTitle>Ny svar-mal</BottomSheetTitle>
          <form action={createInboxSkill} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Navn
              </label>
              <Input name="name" type="text" required autoFocus placeholder="medlemskap-svar" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Beskrivelse
              </label>
              <Input
                name="description"
                type="text"
                required
                placeholder="Spørsmål om innmelding, kontingent og familiemedlemskap"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Instruksjon til AI (system-prompt-snippet)
              </label>
              <Textarea
                name="prompt"
                rows={5}
                required
                placeholder="Når noen spør om medlemskap, henvis til vår medlemskap-side og kontaktpunkt..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Eksempel-svar (valgfri)
              </label>
              <Textarea name="exampleResponse" rows={4} />
            </div>
            <div className="flex gap-2 pt-2">
              <BottomSheetClose asChild>
                <Button type="button" variant="secondary" fullWidth>
                  Avbryt
                </Button>
              </BottomSheetClose>
              <Button type="submit" variant="primary" fullWidth>
                Opprett
              </Button>
            </div>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      <BottomNav role={session.user.role} />
    </>
  )
}
