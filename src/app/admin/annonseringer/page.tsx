import { desc } from 'drizzle-orm'
import { Megaphone, Pin, Plus } from 'lucide-react'
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
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { getDb } from '@/db'
import { announcements } from '@/db/schema'
import { createAnnouncement, deleteAnnouncement } from '@/lib/announcements'

const AUDIENCE_LABEL = {
  alle: 'Alle',
  admin: 'Admin',
  ansatt: 'Ansatt',
} as const

export default async function AdminAnnonseringerPage() {
  const session = await auth()
  if (!session?.user) return null

  const all = await getDb()
    .select()
    .from(announcements)
    .orderBy(desc(announcements.pinned), desc(announcements.createdAt))

  return (
    <>
      <main className="min-h-dvh pb-24">
        <PageHeader
          title="Annonseringer"
          back={{ href: '/admin', label: 'Admin' }}
        />

        <div className="px-6 pt-6">
          {all.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Ingen annonseringer enda"
              description="Tap + nede til høyre for å sende den første beskjeden."
            />
          ) : (
            <div className="space-y-3">
              {all.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-gfgk-border bg-white p-4 shadow-card"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {a.pinned && (
                          <Pin
                            className="h-3.5 w-3.5 text-gfgk-gold-deep"
                            strokeWidth={2.5}
                          />
                        )}
                        <h3 className="text-sm font-bold text-gfgk-text">{a.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gfgk-text-2">
                        <Pill tone="gold" size="sm">
                          {AUDIENCE_LABEL[a.audience]}
                        </Pill>
                        <span>
                          {a.createdAt.toLocaleDateString('nb-NO', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {a.expiresAt && (
                          <span>
                            · utløper{' '}
                            {a.expiresAt.toLocaleDateString('nb-NO', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <form action={deleteAnnouncement.bind(null, a.id)}>
                      <ConfirmButton
                        message={`Slette "${a.title}"?`}
                        className="rounded-md bg-gfgk-red-light px-3 py-1.5 text-xs font-semibold text-gfgk-red-deep hover:bg-gfgk-red/20"
                      >
                        Slett
                      </ConfirmButton>
                    </form>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gfgk-text">{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomSheet>
        <BottomSheetTrigger asChild>
          <FAB aria-label="Ny annonsering">
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </FAB>
        </BottomSheetTrigger>
        <BottomSheetContent>
          <BottomSheetTitle>Ny annonsering</BottomSheetTitle>
          <form action={createAnnouncement} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Tittel
              </label>
              <Input
                name="title"
                type="text"
                required
                autoFocus
                placeholder="F.eks. Klubben stengt 17. mai"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                Tekst
              </label>
              <Textarea name="body" required rows={5} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Til
                </label>
                <Select name="audience" defaultValue="alle">
                  <option value="alle">Alle</option>
                  <option value="ansatt">Bare ansatte</option>
                  <option value="admin">Bare admin</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
                  Utløper
                </label>
                <Input name="expiresAt" type="date" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gfgk-text">
              <input
                type="checkbox"
                name="pinned"
                className="h-4 w-4 accent-gfgk-gold"
              />
              Pinned (vises til alle har huket av)
            </label>

            <div className="flex gap-2 pt-2">
              <BottomSheetClose asChild>
                <Button type="button" variant="secondary" fullWidth>
                  Avbryt
                </Button>
              </BottomSheetClose>
              <Button type="submit" variant="primary" fullWidth>
                Publiser
              </Button>
            </div>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      <BottomNav role={session.user.role} />
    </>
  )
}
