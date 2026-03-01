import { getAuthSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event)
  const { accessToken, accessTokenExpiresAt, user } = session.data

  if (!accessToken || !user) {
    return { authenticated: false }
  }

  // Consider expired if within 60s of expiry
  const isExpired = !accessTokenExpiresAt || Date.now() > accessTokenExpiresAt - 60_000
  if (isExpired) {
    return { authenticated: false }
  }

  return {
    authenticated: true,
    user: {
      id: user.sub,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      roles: user.roles ?? [],
    },
  }
})
