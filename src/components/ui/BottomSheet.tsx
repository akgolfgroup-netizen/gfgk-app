'use client'

import * as RxDialog from '@radix-ui/react-dialog'
import * as React from 'react'
import { cn } from '@/lib/cn'

/**
 * Bottom sheet — sklir opp fra bunn. Bruk i stedet for sentrer-modal
 * for handlinger, pickere og sekundære valg.
 *
 * Bygd på @radix-ui/react-dialog for å få tilgjengelighet (focus trap,
 * Esc-håndtering, scroll lock) gratis.
 */
const BottomSheet = RxDialog.Root
const BottomSheetTrigger = RxDialog.Trigger
const BottomSheetClose = RxDialog.Close
const BottomSheetPortal = RxDialog.Portal

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof RxDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RxDialog.Overlay>
>(({ className, ...props }, ref) => (
  <RxDialog.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50',
      'data-[state=open]:animate-in data-[state=open]:fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      'motion-reduce:transition-none',
      className,
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = 'BottomSheetOverlay'

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof RxDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RxDialog.Content>
>(({ className, children, ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <RxDialog.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px]',
        'rounded-t-2xl bg-white shadow-[0_-2px_16px_rgba(0,0,0,.12)]',
        'pb-safe max-h-[85vh] overflow-y-auto',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300',
        'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:duration-200',
        'motion-reduce:animate-none',
        className,
      )}
      // Opt-out av Radix sin describedby-advarsel når arket ikke har en
      // BottomSheetDescription. Overstyrbar via props ved behov.
      aria-describedby={undefined}
      {...props}
    >
      <div className="flex justify-center pt-3">
        <div
          className="h-1 w-8 rounded-full bg-gfgk-text-3"
          aria-hidden="true"
        />
      </div>
      <div className="px-6 pb-6 pt-3">{children}</div>
    </RxDialog.Content>
  </BottomSheetPortal>
))
BottomSheetContent.displayName = 'BottomSheetContent'

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof RxDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RxDialog.Title>
>(({ className, ...props }, ref) => (
  <RxDialog.Title
    ref={ref}
    className={cn('mb-1 text-lg font-bold text-gfgk-text', className)}
    {...props}
  />
))
BottomSheetTitle.displayName = 'BottomSheetTitle'

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof RxDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RxDialog.Description>
>(({ className, ...props }, ref) => (
  <RxDialog.Description
    ref={ref}
    className={cn('mb-4 text-sm text-gfgk-text-2', className)}
    {...props}
  />
))
BottomSheetDescription.displayName = 'BottomSheetDescription'

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetDescription,
}
