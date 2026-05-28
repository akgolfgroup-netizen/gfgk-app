import { AuthError } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { signIn } from '@/auth'

export default async function DemoPage() {
  // Demo-ruten er kun aktiv når ENABLE_DEMO=true i miljøet.
  // Beskytter mot at noen logger inn som demo-admin i produksjon.
  if (process.env.ENABLE_DEMO !== 'true') {
    notFound()
  }

  try {
    await signIn('credentials', {
      email: 'demo@gfgk.no',
      password: 'Demo1234!',
      redirectTo: '/admin',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=CredentialsSignin')
    }
    throw error
  }
}
