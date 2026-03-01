import { useSession } from 'h3'
import type { H3Event } from 'h3'

export interface AuthUser {
  sub: string
  email?: string
  displayName?: string
  avatarUrl?: string
  roles: string[]
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  /** Unix timestamp in ms */
  accessTokenExpiresAt: number
  idToken?: string
  user: AuthUser
  /** Stored during OIDC initiation, cleared after callback */
  codeVerifier?: string
  /** Stored during OIDC initiation, cleared after callback */
  state?: string
  /** Where to redirect after successful login */
  returnTo?: string
}

export function getAuthSession(event: H3Event) {
  const config = useRuntimeConfig()
  return useSession<Partial<AuthSession>>(event, {
    password: config.logtoCookieSecret as string,
    name: 'framedle-auth',
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  })
}
