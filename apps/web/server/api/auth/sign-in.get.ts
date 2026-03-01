import { buildAuthorizationUrl, randomPKCECodeVerifier, calculatePKCECodeChallenge, randomState } from 'openid-client'
import { getOidcConfig, getRedirectUri } from '../../utils/oidc'
import { getAuthSession } from '../../utils/session'
import { rateLimitByIp } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  rateLimitByIp(event, 'sign-in', 10, 60)

  const query = getQuery(event)
  const returnTo = (query.returnTo as string) || '/'

  const codeVerifier = randomPKCECodeVerifier()
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier)
  const state = randomState()

  const session = await getAuthSession(event)
  await session.update({ codeVerifier, state, returnTo })

  const config = await getOidcConfig()
  const runtimeConfig = useRuntimeConfig()
  const redirectUri = getRedirectUri(event)

  const authUrl = buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: 'openid profile email offline_access',
    resource: runtimeConfig.logtoApiResource as string,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  })

  return sendRedirect(event, authUrl.href)
})
