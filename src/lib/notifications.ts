'use server'

import { sendPushToUser } from '@/lib/push'

/**
 * Domene-events → push. Sentralisert så de ulike modulene kan kalle
 * typede varsel-funksjoner uten å vite om Web Push-detaljene.
 *
 * Alle er best-effort: feil i push skal aldri velte den utløsende handlingen.
 */

export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  taskId: string,
): Promise<void> {
  try {
    await sendPushToUser(userId, {
      title: 'Ny oppgave',
      body: taskTitle,
      url: `/oppgaver/${taskId}`,
    })
  } catch (err) {
    console.error('[notify] task assigned failed:', err)
  }
}

export async function notifyShiftPublished(
  userId: string,
  weekNum: number,
): Promise<void> {
  try {
    await sendPushToUser(userId, {
      title: 'Vaktliste publisert',
      body: `Vaktene for uke ${weekNum} er klare.`,
      url: '/vakter',
    })
  } catch (err) {
    console.error('[notify] shift published failed:', err)
  }
}

export async function notifyAnnouncement(
  userId: string,
  title: string,
): Promise<void> {
  try {
    await sendPushToUser(userId, {
      title: 'Ny beskjed',
      body: title,
      url: '/dashboard',
    })
  } catch (err) {
    console.error('[notify] announcement failed:', err)
  }
}

export async function notifyTimeOffDecision(
  userId: string,
  approved: boolean,
): Promise<void> {
  try {
    await sendPushToUser(userId, {
      title: approved ? 'Ferie godkjent' : 'Ferie avvist',
      body: approved
        ? 'Ferieforespørselen din er godkjent.'
        : 'Ferieforespørselen din ble ikke godkjent.',
      url: '/profil',
    })
  } catch (err) {
    console.error('[notify] time-off decision failed:', err)
  }
}
