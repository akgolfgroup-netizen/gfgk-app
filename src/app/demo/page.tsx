import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'

export default async function DemoPage() {
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
