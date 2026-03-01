import { refreshTokenGrant } from 'openid-client'
import { getOidcConfig } from '../../utils/oidc'
import { getAuthSession } from '../../utils/session'
import { rateLimitBySessionId } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event)
  rateLimitBySessionId(session.id ?? 'anonymous', 'token', 30, 60)

  const { accessToken, refreshToken, accessTokenExpiresAt } = session.data

  if (!accessToken || !refreshToken) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  // Return current token if not expired (with 60s buffer)
  if (accessTokenExpiresAt && Date.now() < accessTokenExpiresAt - 60_000) {
    return { accessToken }
  }

  // Attempt refresh
  try {
    const config = await getOidcConfig()
    const tokens = await refreshTokenGrant(config, refreshToken)

    await session.update({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? refreshToken,
      accessTokenExpiresAt: Date.now() + ((tokens.expires_in ?? 3600) * 1000),
    })

    return { accessToken: tokens.access_token }
  } catch {
    await session.clear()
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }
})
