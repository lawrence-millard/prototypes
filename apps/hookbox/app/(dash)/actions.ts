'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { UUID_RE } from '@/lib/constants'
import { sanitizeError } from '@/lib/errors'
import { deleteMessage } from '@/lib/messages'
import { requestOrigin, webhookIngestUrl } from '@/lib/origin'
import { cleanName } from '@/lib/slug'
import {
  deleteWebhook,
  insertWebhook,
  regenerateWebhookToken,
  renameWebhook,
} from '@/lib/webhooks'

export type RevealState = { url?: string; error?: string } | null
export type FormState = { error?: string; ok?: boolean } | null

export async function createWebhookAction(
  _prev: RevealState,
  formData: FormData,
): Promise<RevealState> {
  await requireSession()
  const name = cleanName(String(formData.get('name') ?? ''))
  if (!name) return { error: 'Use a name between 1 and 80 characters.' }
  try {
    const created = await insertWebhook(name)
    const url = webhookIngestUrl(await requestOrigin(), created.id, created.token)
    revalidatePath('/')
    return { url }
  } catch (error) {
    console.error('create_webhook_failed', sanitizeError(error))
    return { error: 'Could not create the webhook.' }
  }
}

export async function renameWebhookAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireSession()
  const id = String(formData.get('id') ?? '')
  const name = cleanName(String(formData.get('name') ?? ''))
  if (!UUID_RE.test(id) || !name) return { error: 'Use a name between 1 and 80 characters.' }
  try {
    await renameWebhook(id, name)
    revalidatePath('/')
    revalidatePath(`/hooks/${id}`)
    return { ok: true }
  } catch (error) {
    console.error('rename_webhook_failed', sanitizeError(error))
    return { error: 'Could not rename the webhook.' }
  }
}

export async function regenerateWebhookAction(
  _prev: RevealState,
  formData: FormData,
): Promise<RevealState> {
  await requireSession()
  const id = String(formData.get('id') ?? '')
  if (!UUID_RE.test(id)) return { error: 'Unknown webhook.' }
  try {
    const token = await regenerateWebhookToken(id)
    return { url: webhookIngestUrl(await requestOrigin(), id, token) }
  } catch (error) {
    console.error('regenerate_webhook_failed', sanitizeError(error))
    return { error: 'Could not regenerate the token.' }
  }
}

export async function deleteWebhookAction(formData: FormData): Promise<void> {
  await requireSession()
  const id = String(formData.get('id') ?? '')
  if (!UUID_RE.test(id)) return
  await deleteWebhook(id)
  revalidatePath('/')
  redirect('/')
}

export async function deleteMessageAction(formData: FormData): Promise<void> {
  await requireSession()
  const webhookId = String(formData.get('webhookId') ?? '')
  const messageId = String(formData.get('messageId') ?? '')
  if (!UUID_RE.test(webhookId) || !UUID_RE.test(messageId)) return
  await deleteMessage(webhookId, messageId)
  revalidatePath(`/hooks/${webhookId}`)
}
