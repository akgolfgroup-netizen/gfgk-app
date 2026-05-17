'use server'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getDb } from '@/db'
import { transactions } from '@/db/schema'

export async function createTransaction(formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  const type = formData.get('type') as 'inntekt' | 'utgift' | null
  const amountRaw = formData.get('amount') as string | null
  const category = (formData.get('category') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  const date = formData.get('date') as string | null

  if (!type || !amountRaw || !category || !date) throw new Error('Mangler felt')

  const amount = Math.round(parseFloat(amountRaw.replace(',', '.')))
  if (isNaN(amount) || amount <= 0) throw new Error('Ugyldig beløp')

  await getDb().insert(transactions).values({
    type,
    amount,
    category,
    description,
    date,
    createdBy: session.user.id,
  })

  revalidatePath('/admin/budsjett')
}

export async function deleteTransaction(id: string, _formData: FormData) {
  const session = await auth()
  if (session?.user.role !== 'admin') throw new Error('Unauthorized')

  await getDb().delete(transactions).where(eq(transactions.id, id))
  revalidatePath('/admin/budsjett')
}
