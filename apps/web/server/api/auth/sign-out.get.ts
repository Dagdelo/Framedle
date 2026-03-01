import { getOidcConfig } from '../../utils/oidc'
import { getAuthSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getAuthSession(event)
  const idToken = session.data.idToken

  await session.clear()

  const config = await getOidcConfig()
  const meta = config.serverMetadata()
  const url = getRequestURL(event)
  const origin = `${url.protocol}//${url.host}`

  if (meta.end_session_endpoint) {
    const endSessionUrl = new URL(meta.end_session_endpoint)
    if (idToken) {
      endSessionUrl.searchParams.set('id_token_hint', idToken)
    }
    endSessionUrl.searchParams.set('post_logout_redirect_uri', origin)
    return sendRedirect(event, endSessionUrl.href)
  }

  return sendRedirect(event, '/')
})
