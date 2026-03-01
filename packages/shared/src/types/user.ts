export interface UserProfile {
  id: string
  displayName: string
  avatarUrl: string | null
  xp: number
  level: number
  currentStreak: number
  maxStreak: number
  gamesPlayed: number
  gamesWon: number
  createdAt: string
}

export interface UserStats {
  gamesPlayed: number
  gamesWon: number
  winRate: number
  xp: number
  level: number
  currentStreak: number
  maxStreak: number
  averageScore: number
}

export interface MergeResult {
  merged: boolean
  skipped: boolean
  conflicts: string[]
  achievementsMerged: number
  duelMatchesUpdated: number
  xpTransferred: number
}
