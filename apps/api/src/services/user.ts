import { eq, and, desc, count, sql } from 'drizzle-orm'
import { db, schema } from '../db'

export interface MergeResult {
  merged: number
  skipped: number
  conflicts: number
  achievementsMerged: number
  duelMatchesUpdated: number
  xpTransferred: number
}

/**
 * Get or create a user by authProviderId (upsert).
 */
export async function getOrCreateUser(
  authProviderId: string,
  profile?: { displayName?: string; avatarUrl?: string; email?: string },
) {
  const result = await db
    .insert(schema.users)
    .values({
      authProviderId,
      displayName: profile?.displayName ?? 'Player',
      avatarUrl: profile?.avatarUrl,
      email: profile?.email,
    })
    .onConflictDoUpdate({
      target: schema.users.authProviderId,
      set: {
        displayName: profile?.displayName
          ? sql`COALESCE(${profile.displayName}, ${schema.users.displayName})`
          : sql`${schema.users.displayName}`,
        avatarUrl: profile?.avatarUrl
          ? sql`${profile.avatarUrl}`
          : sql`${schema.users.avatarUrl}`,
        email: profile?.email
          ? sql`${profile.email}`
          : sql`${schema.users.email}`,
        updatedAt: new Date(),
      },
    })
    .returning()

  return result[0]
}

/**
 * Update user profile fields.
 */
export async function updateProfile(
  userId: string,
  data: { displayName?: string; avatarUrl?: string },
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (data.displayName !== undefined) updates.displayName = data.displayName
  if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl

  const result = await db
    .update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, userId))
    .returning()

  return result[0]
}

/**
 * Get user game statistics.
 */
export async function getUserStats(userId: string) {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)
    .then((rows) => rows[0])

  if (!user) return null

  const [gamesPlayedResult, gamesWonResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(schema.gameResults)
      .where(
        and(
          eq(schema.gameResults.userId, userId),
          eq(schema.gameResults.completed, true),
        ),
      )
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(schema.gameResults)
      .where(
        and(
          eq(schema.gameResults.userId, userId),
          eq(schema.gameResults.won, true),
        ),
      )
      .then((r) => r[0].count),
  ])

  return {
    xp: user.xp,
    level: user.level,
    title: user.title,
    streakCurrent: user.streakCurrent,
    streakBest: user.streakBest,
    gamesPlayed: gamesPlayedResult,
    gamesWon: gamesWonResult,
    winRate: gamesPlayedResult > 0 ? gamesWonResult / gamesPlayedResult : 0,
  }
}

/**
 * Get paginated game history for a user.
 */
export async function getUserHistory(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit

  const results = await db
    .select({
      id: schema.gameResults.id,
      dailyGameId: schema.gameResults.dailyGameId,
      score: schema.gameResults.score,
      maxScore: schema.gameResults.maxScore,
      guessesUsed: schema.gameResults.guessesUsed,
      completed: schema.gameResults.completed,
      won: schema.gameResults.won,
      completedAt: schema.gameResults.completedAt,
      gameDate: schema.dailyGames.gameDate,
      mode: schema.dailyGames.mode,
    })
    .from(schema.gameResults)
    .innerJoin(
      schema.dailyGames,
      eq(schema.gameResults.dailyGameId, schema.dailyGames.id),
    )
    .where(eq(schema.gameResults.userId, userId))
    .orderBy(desc(schema.gameResults.completedAt))
    .limit(limit)
    .offset(offset)

  const totalResult = await db
    .select({ count: count() })
    .from(schema.gameResults)
    .where(eq(schema.gameResults.userId, userId))

  return {
    results,
    total: totalResult[0].count,
    page,
    limit,
  }
}

/**
 * Claim anonymous user history by merging into authenticated user.
 * Full conflict resolution in a single PostgreSQL transaction.
 */
export async function claimAnonymous(
  authProviderId: string,
  fingerprint: string,
): Promise<MergeResult> {
  const result: MergeResult = {
    merged: 0,
    skipped: 0,
    conflicts: 0,
    achievementsMerged: 0,
    duelMatchesUpdated: 0,
    xpTransferred: 0,
  }

  await db.transaction(async (tx) => {
    // Get authenticated user
    const authUser = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.authProviderId, authProviderId))
      .limit(1)
      .then((rows) => rows[0])

    if (!authUser) throw new Error('Authenticated user not found')

    // Get anonymous user with FOR UPDATE lock
    const anonUser = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.anonFingerprint, fingerprint))
      .for('update')
      .limit(1)
      .then((rows) => rows[0])

    if (!anonUser) throw new Error('Anonymous user not found')
    if (anonUser.id === authUser.id) throw new Error('Cannot merge user with itself')

    // 1. Merge game_results — skip conflicts on UNIQUE(user_id, daily_game_id)
    const anonResults = await tx
      .select()
      .from(schema.gameResults)
      .where(eq(schema.gameResults.userId, anonUser.id))

    for (const gameResult of anonResults) {
      try {
        await tx
          .update(schema.gameResults)
          .set({ userId: authUser.id })
          .where(eq(schema.gameResults.id, gameResult.id))
        result.merged++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('unique') || msg.includes('duplicate')) {
          result.conflicts++
          result.skipped++
        } else {
          throw e
        }
      }
    }

    // 2. Merge userAchievements — skip composite PK conflicts
    const anonAchievements = await tx
      .select()
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, anonUser.id))

    for (const achievement of anonAchievements) {
      try {
        await tx
          .insert(schema.userAchievements)
          .values({
            userId: authUser.id,
            achievementId: achievement.achievementId,
            unlockedAt: achievement.unlockedAt,
          })
          .onConflictDoNothing()
        result.achievementsMerged++
      } catch {
        // Skip on conflict
      }
    }

    // Clean up anon achievements after merge
    await tx
      .delete(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, anonUser.id))

    // 3. Update duelMatches FK references
    const duelUpdatesP1 = await tx
      .update(schema.duelMatches)
      .set({ player1Id: authUser.id })
      .where(eq(schema.duelMatches.player1Id, anonUser.id))
      .returning()

    const duelUpdatesP2 = await tx
      .update(schema.duelMatches)
      .set({ player2Id: authUser.id })
      .where(eq(schema.duelMatches.player2Id, anonUser.id))
      .returning()

    const duelUpdatesWinner = await tx
      .update(schema.duelMatches)
      .set({ winnerId: authUser.id })
      .where(eq(schema.duelMatches.winnerId, anonUser.id))
      .returning()

    result.duelMatchesUpdated =
      duelUpdatesP1.length + duelUpdatesP2.length + duelUpdatesWinner.length

    // 4. Merge XP and streaks
    result.xpTransferred = anonUser.xp
    await tx
      .update(schema.users)
      .set({
        xp: sql`${schema.users.xp} + ${anonUser.xp}`,
        streakBest: sql`GREATEST(${schema.users.streakBest}, ${anonUser.streakBest})`,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, authUser.id))

    // 5. Delete anonymous user
    await tx.delete(schema.users).where(eq(schema.users.id, anonUser.id))

    console.log(
      `[MERGE_AUDIT] ${JSON.stringify({
        authUserId: authUser.id,
        anonUserId: anonUser.id,
        fingerprint,
        ...result,
        timestamp: new Date().toISOString(),
      })}`,
    )
  })

  return result
}
