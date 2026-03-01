import { discovery, ClientSecretPost } from 'openid-client'
import type { Configuration } from 'openid-client'

let _config: Configuration | null = null

export async function getOidcConfig(): Promise<Configuration> {
  if (_config) return _config

  const runtimeConfig = useRuntimeConfig()
  const logtoEndpoint = runtimeConfig.logtoEndpoint
  const logtoAppId = runtimeConfig.logtoAppId
  const logtoAppSecret = runtimeConfig.logtoAppSecret

  _config = await discovery(
    new URL(logtoEndpoint),
    logtoAppId,
    undefined,
    ClientSecretPost(logtoAppSecret),
  )

  return _config
}

export function getRedirectUri(event: import('h3').H3Event): string {
  const url = getRequestURL(event)
  return `${url.protocol}//${url.host}/api/auth/callback`
}
