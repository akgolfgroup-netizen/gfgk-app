'use client'

import { Upload } from 'lucide-react'
import { useRef } from 'react'
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface DocumentUploaderProps {
  userId: string | null
  onUpload: (formData: FormData) => Promise<void>
}

export function DocumentUploader({ userId, onUpload }: DocumentUploaderProps) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="primary" size="lg" fullWidth>
          <Upload className="h-5 w-5" />
          Last opp dokument
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetTitle>Nytt dokument</BottomSheetTitle>
        <form ref={formRef} action={onUpload} className="space-y-3">
          {userId && <input type="hidden" name="userId" value={userId} />}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
              Kategori
            </label>
            <Select name="category" defaultValue="kontrakt">
              <option value="kontrakt">Kontrakt</option>
              <option value="ferieattest">Ferieattest</option>
              <option value="sykmelding">Sykmelding</option>
              <option value="kvittering">Kvittering</option>
              <option value="annet">Annet</option>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
              Navn (valgfri — bruker filnavn ellers)
            </label>
            <Input name="name" type="text" placeholder="F.eks. Arbeidskontrakt 2026" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
              Utløper (valgfri)
            </label>
            <Input name="expiresAt" type="date" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gfgk-text">
              Fil
            </label>
            <input
              name="file"
              type="file"
              required
              accept="application/pdf,image/*,.doc,.docx"
              className="block w-full rounded-xl border border-gfgk-border-strong bg-white px-4 py-3 text-sm text-gfgk-text file:mr-3 file:rounded-md file:border-0 file:bg-gfgk-gold file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-gfgk-black"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <BottomSheetClose asChild>
              <Button type="button" variant="secondary" fullWidth>
                Avbryt
              </Button>
            </BottomSheetClose>
            <Button type="submit" variant="primary" fullWidth>
              Last opp
            </Button>
          </div>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  )
}
