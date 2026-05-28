'use client'

import { AlertTriangle } from 'lucide-react'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'

interface ShiftEventFormProps {
  shiftId: string | null
  onLog: (formData: FormData) => Promise<void>
}

export function ShiftEventForm({ shiftId, onLog }: ShiftEventFormProps) {
  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="secondary" size="md" fullWidth>
          <AlertTriangle className="h-4 w-4" />
          Loggfør hendelse
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetTitle>Loggfør hendelse</BottomSheetTitle>
        <form action={onLog} className="space-y-3">
          {shiftId && <input type="hidden" name="shiftId" value={shiftId} />}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
              Kategori
            </label>
            <Select name="category" defaultValue="hendelse">
              <option value="hendelse">Generell hendelse</option>
              <option value="klage">Klage</option>
              <option value="maskin">Maskin / utstyr</option>
              <option value="observasjon">Observasjon</option>
              <option value="annet">Annet</option>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
              Alvorlighet
            </label>
            <Select name="severity" defaultValue="info">
              <option value="info">Info</option>
              <option value="medium">Medium</option>
              <option value="hoy">Høy</option>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
              Beskrivelse
            </label>
            <Textarea
              name="body"
              required
              rows={4}
              placeholder="Beskriv hva som skjedde..."
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-2">
            <BottomSheetClose asChild>
              <Button type="button" variant="secondary" fullWidth>
                Avbryt
              </Button>
            </BottomSheetClose>
            <Button type="submit" variant="primary" fullWidth>
              Loggfør
            </Button>
          </div>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  )
}
