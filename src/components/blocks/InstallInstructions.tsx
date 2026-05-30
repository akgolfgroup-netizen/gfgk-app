'use client'

import { Check, Download, MoreVertical, Plus, Share, SquarePlus } from 'lucide-react'
import * as React from 'react'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'

export type InstallPlatform = 'ios' | 'android' | 'desktop'

/**
 * Plattform-deteksjon for installasjonsveiledning. Klient-only (leser navigator).
 * iOS = iPhone/iPad/iPod og IKKE allerede standalone (installert).
 */
export function detectInstallPlatform(): InstallPlatform {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'desktop'
  }
  const ua = navigator.userAgent
  const standalone = window.matchMedia('(display-mode: standalone)').matches
  if (/iphone|ipad|ipod/i.test(ua) && !standalone) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

interface Step {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  text: React.ReactNode
}

const STEPS: Record<InstallPlatform, Step[]> = {
  ios: [
    {
      icon: Share,
      text: (
        <>
          Trykk <span className="font-semibold text-gfgk-text">Del</span>-knappen
          (firkant med pil opp) nederst i Safari.
        </>
      ),
    },
    {
      icon: SquarePlus,
      text: (
        <>
          Velg{' '}
          <span className="font-semibold text-gfgk-text">
            «Legg til på Hjem-skjerm»
          </span>
          .
        </>
      ),
    },
    {
      icon: Check,
      text: (
        <>
          Trykk <span className="font-semibold text-gfgk-text">«Legg til»</span> oppe
          til høyre.
        </>
      ),
    },
  ],
  android: [
    {
      icon: MoreVertical,
      text: (
        <>
          Trykk <span className="font-semibold text-gfgk-text">meny (⋮)</span> øverst
          til høyre i Chrome.
        </>
      ),
    },
    {
      icon: Download,
      text: (
        <>
          Velg{' '}
          <span className="font-semibold text-gfgk-text">
            «Installer app»
          </span>{' '}
          eller «Legg til på startskjerm».
        </>
      ),
    },
  ],
  desktop: [
    {
      icon: Download,
      text: (
        <>
          Trykk{' '}
          <span className="font-semibold text-gfgk-text">installer-ikonet</span> i
          adresselinjen (helt til høyre).
        </>
      ),
    },
    {
      icon: Plus,
      text: (
        <>
          Bekreft{' '}
          <span className="font-semibold text-gfgk-text">«Installer»</span> i dialogen.
        </>
      ),
    },
  ],
}

const PLATFORM_INTRO: Record<InstallPlatform, string> = {
  ios: 'Følg stegene under for å legge GFGK på Hjem-skjermen.',
  android: 'Følg stegene under for å installere GFGK.',
  desktop: 'Følg stegene under for å installere GFGK på maskinen.',
}

export interface InstallInstructionsProps {
  /** Overstyr plattform; utelat for auto-deteksjon ved montering. */
  platform?: InstallPlatform
}

/**
 * Plattform-tilpassede steg-for-steg-instruksjoner for «legg til på hjemskjerm».
 * Brukes som innhold inni en BottomSheet (se InstallInstructionsSheet).
 */
export function InstallInstructions({ platform: platformProp }: InstallInstructionsProps) {
  const [detected, setDetected] = React.useState<InstallPlatform>(
    platformProp ?? 'desktop',
  )

  React.useEffect(() => {
    // queueMicrotask: unngå synkron setState i effect (cascading renders).
    if (!platformProp) queueMicrotask(() => setDetected(detectInstallPlatform()))
  }, [platformProp])

  const platform = platformProp ?? detected
  const steps = STEPS[platform]

  return (
    <div className="space-y-4">
      <p className="text-sm text-gfgk-text-2">{PLATFORM_INTRO[platform]}</p>

      <ol className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gfgk-gold-light text-gfgk-gold-deep">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-sm text-gfgk-text-2">
                  <span className="mr-1 font-bold text-gfgk-text">{i + 1}.</span>
                  {step.text}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      {platform === 'ios' && (
        <p className="rounded-xl border border-gfgk-border bg-gfgk-cream-deep px-3 py-2 text-xs text-gfgk-text-2">
          Dette må gjøres i <span className="font-semibold">Safari</span> — ikke i en
          annen nettleser eller en lenke åpnet inne i en app.
        </p>
      )}
    </div>
  )
}

export interface InstallInstructionsSheetProps {
  /** Element som åpner arket (asChild). */
  trigger: React.ReactNode
  /** Overstyr plattform; utelat for auto-deteksjon. */
  platform?: InstallPlatform
  /** Kontrollert åpen-tilstand (valgfri). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Ferdig BottomSheet med InstallInstructions. Gjenbrukes fra både banner og profil.
 */
export function InstallInstructionsSheet({
  trigger,
  platform,
  open,
  onOpenChange,
}: InstallInstructionsSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetTrigger asChild>{trigger}</BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetTitle>Installer GFGK</BottomSheetTitle>
        <BottomSheetDescription>
          Legg til på hjemskjermen for rask tilgang og en app-følelse.
        </BottomSheetDescription>
        <InstallInstructions platform={platform} />
      </BottomSheetContent>
    </BottomSheet>
  )
}
