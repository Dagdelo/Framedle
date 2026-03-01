import { eq } from 'drizzle-orm'
import { db, schema } from '../db'
import { getOrCreateUser } from './user'

/**
 * Sync user creation from Logto webhook.
 */
export async function syncUserCreated(data: {
  id: string
  name?: string
  avatar?: string
  primaryEmail?: string
}) {
  return getOrCreateUser(data.id, {
    displayName: data.name,
    avatarUrl: data.avatar,
    email: data.primaryEmail,
  })
}

/**
 * Sync user data update from Logto webhook.
 */
export async function syncUserUpdated(data: {
  id: string
  name?: string
  avatar?: string
  primaryEmail?: string
}) {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.authProviderId, data.id))
    .limit(1)
    .then((rows) => rows[0])

  if (!user) return null

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.name !== undefined) updates.displayName = data.name
  if (data.avatar !== undefined) updates.avatarUrl = data.avatar
  if (data.primaryEmail !== undefined) updates.email = data.primaryEmail

  const result = await db
    .update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, user.id))
    .returning()

  return result[0]
}

/**
 * Soft-delete user from Logto webhook. Anonymize PII, keep game results.
 */
export async function syncUserDeleted(authProviderId: string) {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.authProviderId, authProviderId))
    .limit(1)
    .then((rows) => rows[0])

  if (!user) return null

  const result = await db
    .update(schema.users)
    .set({
      displayName: 'Deleted User',
      avatarUrl: null,
      email: null,
      authProviderId: null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id))
    .returning()

  return result[0]
}
