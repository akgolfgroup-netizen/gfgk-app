import {
  CalendarClock,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ConfirmButton } from '@/components/ConfirmButton'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type {
  SponsorAgreement,
  SponsorCommType,
  SponsorStatus,
  SponsorTier,
} from '@/db/schema'
import {
  createAgreement,
  deleteAgreement,
  deleteCommunication,
  deleteSponsor,
  getSponsor,
  logCommunication,
  updateSponsor,
} from '@/lib/sponsors'

const TIER_LABEL: Record<SponsorTier, string> = {
  hovedsponsor: 'Hovedsponsor',
  gull: 'Gull',
  solv: 'Sølv',
  partner: 'Partner',
}
const STATUS_LABEL: Record<SponsorStatus, string> = {
  prospekt: 'Prospekt',
  aktiv: 'Aktiv',
  utlopt: 'Utløpt',
}
const STATUS_TONE: Record<SponsorStatus, 'teal' | 'gold' | 'red'> = {
  prospekt: 'gold',
  aktiv: 'teal',
  utlopt: 'red',
}
const COMM_LABEL: Record<SponsorCommType, string> = {
  mote: 'Møte',
  epost: 'E-post',
  telefon: 'Telefon',
  annet: 'Annet',
}

function formatNum(n: number) {
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(n)
}
function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
function agreementBadge(a: SponsorAgreement): { label: string; tone: 'teal' | 'gold' | 'red' | 'neutral' } {
  if (!a.endDate) return { label: 'Løpende', tone: 'neutral' }
  const end = new Date(a.endDate + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const days = Math.round((end.getTime() - now.getTime()) / 86_400_000)
  if (days < 0) return { label: 'Utløpt', tone: 'red' }
  if (days <= 60) return { label: `Utløper om ${days} d`, tone: 'gold' }
  return { label: 'Aktiv', tone: 'teal' }
}

const today = () => new Date().toISOString().slice(0, 10)

export default async function SponsorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'admin') redirect('/dashboard')

  const { id } = await params
  const data = await getSponsor(id)
  if (!data) notFound()
  const { sponsor, agreements, communications } = data
  const totalValue = agreements.reduce((s, a) => s + a.valuePerYear, 0)

  return (
    <>
        <PageHeader
          title={sponsor.name}
          back={{ href: '/admin/sponsorer', label: 'Sponsorer' }}
          action={
            <BottomSheet>
              <BottomSheetTrigger asChild>
                <button
                  className="rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                  aria-label="Rediger sponsor"
                >
                  Rediger
                </button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <BottomSheetTitle>Rediger sponsor</BottomSheetTitle>
                <form action={updateSponsor.bind(null, id)} className="space-y-3">
                  <Input name="name" defaultValue={sponsor.name} required />
                  <div className="grid grid-cols-2 gap-3">
                    <Select name="tier" defaultValue={sponsor.tier}>
                      <option value="hovedsponsor">Hovedsponsor</option>
                      <option value="gull">Gull</option>
                      <option value="solv">Sølv</option>
                      <option value="partner">Partner</option>
                    </Select>
                    <Select name="status" defaultValue={sponsor.status}>
                      <option value="prospekt">Prospekt</option>
                      <option value="aktiv">Aktiv</option>
                      <option value="utlopt">Utløpt</option>
                    </Select>
                  </div>
                  <Input name="contactName" defaultValue={sponsor.contactName ?? ''} placeholder="Kontaktperson" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input name="contactEmail" type="email" defaultValue={sponsor.contactEmail ?? ''} placeholder="E-post" />
                    <Input name="contactPhone" type="tel" defaultValue={sponsor.contactPhone ?? ''} placeholder="Telefon" />
                  </div>
                  <Input name="website" defaultValue={sponsor.website ?? ''} placeholder="Nettside" />
                  <Textarea name="notes" defaultValue={sponsor.notes ?? ''} rows={2} placeholder="Notat" />
                  <div className="flex gap-2 pt-2">
                    <form action={deleteSponsor.bind(null, id)} className="flex-1">
                      <ConfirmButton
                        message="Slette denne sponsoren? Avtaler og logg slettes også."
                        className="flex h-11 w-full items-center justify-center rounded-xl bg-gfgk-red text-sm font-semibold text-white hover:bg-gfgk-red-deep"
                      >
                        Slett
                      </ConfirmButton>
                    </form>
                    <BottomSheetClose asChild>
                      <Button type="submit" variant="primary" fullWidth>
                        Lagre
                      </Button>
                    </BottomSheetClose>
                  </div>
                </form>
              </BottomSheetContent>
            </BottomSheet>
          }
        />

        <div className="space-y-6 px-6 pt-6">
          {/* Info */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Pill tone={sponsor.tier === 'hovedsponsor' ? 'black' : sponsor.tier === 'gull' ? 'gold' : 'neutral'} size="sm">
                {TIER_LABEL[sponsor.tier]}
              </Pill>
              <Pill tone={STATUS_TONE[sponsor.status]} size="sm">
                {STATUS_LABEL[sponsor.status]}
              </Pill>
            </div>
            <div>
              <p className="kpi-label">Årlig verdi</p>
              <p className="kpi-value mt-0.5 text-3xl text-gfgk-teal-deep">
                {formatNum(totalValue)}
                <span className="ml-1 text-sm font-normal text-gfgk-text-3">kr/år</span>
              </p>
            </div>
            {(sponsor.contactName || sponsor.contactEmail || sponsor.contactPhone || sponsor.website) && (
              <div className="space-y-1.5 border-t border-gfgk-border pt-3 text-sm">
                {sponsor.contactName && (
                  <p className="font-semibold text-gfgk-text">{sponsor.contactName}</p>
                )}
                {sponsor.contactEmail && (
                  <a href={`mailto:${sponsor.contactEmail}`} className="flex items-center gap-2 text-gfgk-text-2">
                    <Mail className="h-4 w-4 shrink-0" /> {sponsor.contactEmail}
                  </a>
                )}
                {sponsor.contactPhone && (
                  <a href={`tel:${sponsor.contactPhone}`} className="flex items-center gap-2 text-gfgk-text-2">
                    <Phone className="h-4 w-4 shrink-0" /> {sponsor.contactPhone}
                  </a>
                )}
                {sponsor.website && (
                  <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gfgk-gold-deep">
                    <ExternalLink className="h-4 w-4 shrink-0" /> {sponsor.website}
                  </a>
                )}
              </div>
            )}
            {sponsor.notes && (
              <p className="border-t border-gfgk-border pt-3 text-sm text-gfgk-text-2">
                {sponsor.notes}
              </p>
            )}
          </Card>

          {/* Avtaler */}
          <section>
            <SectionLabel>Avtaler</SectionLabel>
            <div className="space-y-2">
              {agreements.length === 0 ? (
                <p className="text-sm text-gfgk-text-3">Ingen avtaler registrert.</p>
              ) : (
                agreements.map((a) => {
                  const badge = agreementBadge(a)
                  return (
                    <div key={a.id} className="rounded-xl border border-gfgk-border bg-white p-4 shadow-card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gfgk-text">{a.title}</p>
                          <p className="mt-0.5 font-mono-nums text-sm text-gfgk-text-2">
                            {formatNum(a.valuePerYear)} kr/år
                          </p>
                        </div>
                        <Pill tone={badge.tone} size="sm">{badge.label}</Pill>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 font-mono-nums text-xs text-gfgk-text-3">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatDate(a.startDate)} – {formatDate(a.endDate)}
                      </p>
                      {a.deliverables && (
                        <p className="mt-2 text-sm text-gfgk-text-2">{a.deliverables}</p>
                      )}
                      <form action={deleteAgreement.bind(null, a.id, id)} className="mt-2">
                        <ConfirmButton
                          message="Slette denne avtalen?"
                          className="text-xs font-semibold text-gfgk-red-deep hover:underline"
                        >
                          Slett avtale
                        </ConfirmButton>
                      </form>
                    </div>
                  )
                })
              )}
            </div>
            <BottomSheet>
              <BottomSheetTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-3">
                  <Plus className="h-4 w-4" /> Ny avtale
                </Button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <BottomSheetTitle>Ny avtale</BottomSheetTitle>
                <form action={createAgreement.bind(null, id)} className="space-y-3">
                  <Input name="title" placeholder="Tittel (f.eks. Hovedavtale 2026)" required autoFocus />
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Årlig verdi (kr)</label>
                    <Input name="valuePerYear" type="number" min="0" inputMode="numeric" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Fra</label>
                      <Input name="startDate" type="date" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Til</label>
                      <Input name="endDate" type="date" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Leveranser</label>
                    <Textarea name="deliverables" rows={2} placeholder="Skilt, drakt, banner, digital …" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <BottomSheetClose asChild>
                      <Button type="button" variant="secondary" fullWidth>Avbryt</Button>
                    </BottomSheetClose>
                    <Button type="submit" variant="primary" fullWidth>Lagre</Button>
                  </div>
                </form>
              </BottomSheetContent>
            </BottomSheet>
          </section>

          {/* Kommunikasjon */}
          <section>
            <SectionLabel>Kommunikasjon</SectionLabel>
            <div className="space-y-2">
              {communications.length === 0 ? (
                <p className="text-sm text-gfgk-text-3">Ingen logg ennå.</p>
              ) : (
                communications.map((c) => (
                  <div key={c.id} className="rounded-xl border border-gfgk-border bg-white p-3 shadow-card">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Pill tone="neutral" size="sm">{COMM_LABEL[c.type]}</Pill>
                        <span className="font-mono-nums text-xs text-gfgk-text-3">
                          {formatDate(c.occurredAt)}
                        </span>
                      </div>
                      <form action={deleteCommunication.bind(null, c.id, id)}>
                        <ConfirmButton
                          message="Slette denne loggføringen?"
                          className="text-gfgk-text-3 hover:text-gfgk-red-deep"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ConfirmButton>
                      </form>
                    </div>
                    <p className="mt-1.5 text-sm text-gfgk-text">{c.summary}</p>
                    {c.followUpDate && (
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gfgk-gold-light px-2 py-0.5 font-mono-nums text-xs font-medium text-gfgk-gold-deep">
                        <CalendarClock className="h-3 w-3" /> Følg opp {formatDate(c.followUpDate)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
            <BottomSheet>
              <BottomSheetTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-3">
                  <Plus className="h-4 w-4" /> Loggfør kontakt
                </Button>
              </BottomSheetTrigger>
              <BottomSheetContent>
                <BottomSheetTitle>Loggfør kontakt</BottomSheetTitle>
                <form action={logCommunication.bind(null, id)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Type</label>
                      <Select name="type" defaultValue="mote">
                        <option value="mote">Møte</option>
                        <option value="epost">E-post</option>
                        <option value="telefon">Telefon</option>
                        <option value="annet">Annet</option>
                      </Select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Dato</label>
                      <Input name="occurredAt" type="date" defaultValue={today()} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Sammendrag</label>
                    <Textarea name="summary" rows={3} required placeholder="Hva ble avtalt / sagt?" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">Følg opp (valgfri)</label>
                    <Input name="followUpDate" type="date" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <BottomSheetClose asChild>
                      <Button type="button" variant="secondary" fullWidth>Avbryt</Button>
                    </BottomSheetClose>
                    <Button type="submit" variant="primary" fullWidth>Lagre</Button>
                  </div>
                </form>
              </BottomSheetContent>
            </BottomSheet>
          </section>
        </div>
    </>
  )
}
