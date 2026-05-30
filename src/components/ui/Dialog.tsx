'use client'

import * as RxDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/cn'

/**
 * Sentrer-modal for destruktive bekreftelser. For sekundære handlinger,
 * bruk BottomSheet i stedet.
 */
const Dialog = RxDialog.Root
const DialogTrigger = RxDialog.Trigger
const DialogPortal = RxDialog.Portal
const DialogClose = RxDialog.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof RxDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RxDialog.Overlay>
>(({ className, ...props }, ref) => (
  <RxDialog.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      'motion-reduce:transition-none',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = 'DialogOverlay'

const DialogContent = React.forwardRef<
  React.ElementRef<typeof RxDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RxDialog.Content> & {
    showClose?: boolean
  }
>(({ className, children, showClose = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <RxDialog.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-[calc(100%-3rem)] max-w-[320px] -translate-x-1/2 -translate-y-1/2',
        'rounded-2xl border border-gfgk-border bg-white p-6 shadow-xl',
        'data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0',
        'motion-reduce:animate-none',
        className,
      )}
      // Opt-out av Radix sin describedby-advarsel når modalen ikke har en
      // DialogDescription. Overstyrbar via props ved behov.
      aria-describedby={undefined}
      {...props}
    >
      {children}
      {showClose && (
        <RxDialog.Close
          className="absolute right-3 top-3 rounded-md p-1.5 text-gfgk-text-3 transition-colors hover:bg-gfgk-cream-deep hover:text-gfgk-text"
          aria-label="Lukk"
        >
          <X className="h-4 w-4" />
        </RxDialog.Close>
      )}
    </RxDialog.Content>
  </DialogPortal>
))
DialogContent.displayName = 'DialogContent'

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5', className)} {...props} />
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-6 flex flex-row justify-end gap-2', className)}
      {...props}
    />
  )
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof RxDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RxDialog.Title>
>(({ className, ...props }, ref) => (
  <RxDialog.Title
    ref={ref}
    className={cn('text-lg font-bold text-gfgk-text', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof RxDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RxDialog.Description>
>(({ className, ...props }, ref) => (
  <RxDialog.Description
    ref={ref}
    className={cn('text-sm text-gfgk-text-2', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
