import { authorizationCodeGrant, fetchUserInfo } from 'openid-client'
import { getOidcConfig, getRedirectUri } from '../../utils/oidc'
import { getAuthSession } from '../../utils/session'
import { rateLimitByIp } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  rateLimitByIp(event, 'callback', 10, 60)

  const session = await getAuthSession(event)
  const { codeVerifier, state, returnTo = '/' } = session.data

  if (!codeVerifier || !state) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid session: missing PKCE verifier or state' })
  }

  const config = await getOidcConfig()
  const redirectUri = getRedirectUri(event)
  const currentUrl = getRequestURL(event)

  const tokens = await authorizationCodeGrant(
    config,
    currentUrl,
    { pkceCodeVerifier: codeVerifier, expectedState: state },
    { redirect_uri: redirectUri },
  )

  const claims = tokens.claims()
  const userinfo = await fetchUserInfo(config, tokens.access_token, claims?.sub as string)

  // Logto includes roles in userinfo when the roles scope/resource is configured
  const roles: string[] = (userinfo.roles as string[] | undefined) ?? []

  await session.update({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt: Date.now() + ((tokens.expires_in ?? 3600) * 1000),
    idToken: tokens.id_token,
    codeVerifier: undefined,
    state: undefined,
    returnTo: undefined,
    user: {
      sub: userinfo.sub,
      email: userinfo.email as string | undefined,
      displayName: userinfo.name as string | undefined,
      avatarUrl: userinfo.picture as string | undefined,
      roles,
    },
  })

  return sendRedirect(event, returnTo)
})
