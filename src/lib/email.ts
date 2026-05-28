import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM ?? 'GFGK <onboarding@resend.dev>'

function getClient() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function sendEmail(opts: { to: string | string[]; subject: string; html: string }) {
  const client = getClient()
  if (!client) {
    console.log('[email] skipped (no RESEND_API_KEY):', opts.subject, '→', opts.to)
    return { skipped: true }
  }
  try {
    await client.emails.send({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html })
    return { sent: true }
  } catch (err) {
    console.error('[email] failed:', err)
    return { failed: true }
  }
}

export function inviteEmailHtml(opts: { url: string; role: string }) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: #0A0A0A; padding: 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #F5C518; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">GFGK</h1>
        <p style="color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 13px;">Gamle Fredrikstad Golfklubb</p>
      </div>
      <div style="padding: 24px 4px;">
        <h2 style="color: #1B1B1B; font-size: 18px; margin: 0 0 12px;">Velkommen til GFGK-appen</h2>
        <p style="color: #5A5A5A; line-height: 1.5; margin: 0 0 20px;">
          Du har blitt invitert som <strong>${opts.role}</strong>. Klikk lenken under for å opprette din konto.
        </p>
        <a href="${opts.url}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">
          Opprett konto
        </a>
        <p style="color: #9C9C9C; font-size: 12px; margin: 24px 0 0;">
          Lenken er gyldig i 7 dager. Hvis knappen ikke fungerer, kopier denne URL-en:<br>
          <span style="word-break: break-all;">${opts.url}</span>
        </p>
      </div>
    </div>
  `
}

export function taskAssignedEmailHtml(opts: {
  name: string
  title: string
  dueDate: string | null
  appUrl: string
  taskId: string
}) {
  const dueLine = opts.dueDate
    ? `<p style="color: #5A5A5A; margin: 0 0 8px;">Frist: <strong>${new Date(opts.dueDate).toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>`
    : ''
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: #0A0A0A; padding: 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #F5C518; margin: 0; font-size: 22px; font-weight: 800;">GFGK</h1>
      </div>
      <div style="padding: 24px 4px;">
        <h2 style="color: #1B1B1B; font-size: 18px; margin: 0 0 12px;">Hei ${opts.name}!</h2>
        <p style="color: #5A5A5A; line-height: 1.5; margin: 0 0 12px;">
          Du har fått en ny oppgave:
        </p>
        <div style="background: #FAF7EE; border-left: 4px solid #F5C518; padding: 12px 16px; margin: 0 0 16px; border-radius: 4px;">
          <p style="color: #1B1B1B; font-size: 15px; font-weight: 600; margin: 0 0 4px;">${opts.title}</p>
          ${dueLine}
        </div>
        <a href="${opts.appUrl}/oppgaver/${opts.taskId}" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">
          Åpne oppgave
        </a>
      </div>
    </div>
  `
}

export function shiftPublishedEmailHtml(opts: { name: string; weekNum: number; appUrl: string }) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: #0A0A0A; padding: 20px; border-radius: 8px; text-align: center;">
        <h1 style="color: #F5C518; margin: 0; font-size: 22px; font-weight: 800;">GFGK</h1>
      </div>
      <div style="padding: 24px 4px;">
        <h2 style="color: #1B1B1B; font-size: 18px; margin: 0 0 12px;">Hei ${opts.name}!</h2>
        <p style="color: #5A5A5A; line-height: 1.5; margin: 0 0 20px;">
          Vaktlisten for <strong>uke ${opts.weekNum}</strong> er nå publisert. Sjekk dine vakter i appen.
        </p>
        <a href="${opts.appUrl}/dashboard" style="display: inline-block; background: #F5C518; color: #0A0A0A; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px;">
          Se mine vakter
        </a>
      </div>
    </div>
  `
}
