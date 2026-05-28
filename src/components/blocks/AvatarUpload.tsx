'use client'

import { Camera } from 'lucide-react'
import { useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'

interface AvatarUploadProps {
  src: string | null
  name: string | null
  email: string
  onUpload: (formData: FormData) => Promise<void>
}

export function AvatarUpload({ src, name, email, onUpload }: AvatarUploadProps) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={onUpload}>
      <label
        htmlFor="avatar-upload"
        className="group relative inline-block cursor-pointer"
      >
        <Avatar
          size="xl"
          src={src}
          name={name}
          email={email}
          className="border-2 border-gfgk-cream-deep transition-opacity group-hover:opacity-80"
        />
        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gfgk-gold shadow-sm">
          <Camera className="h-3.5 w-3.5 text-gfgk-black" strokeWidth={2.5} />
        </span>
        <input
          id="avatar-upload"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
    </form>
  )
}
