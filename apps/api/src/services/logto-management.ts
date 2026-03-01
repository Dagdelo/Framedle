let cachedToken: { token: string; expiresAt: number } | null = null

async function getM2MToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const endpoint = process.env.LOGTO_ENDPOINT
  const appId = process.env.LOGTO_M2M_APP_ID
  const appSecret = process.env.LOGTO_M2M_APP_SECRET
  const resource = process.env.LOGTO_MANAGEMENT_API_RESOURCE || `${endpoint}/api`

  if (!endpoint || !appId || !appSecret) {
    throw new Error('LOGTO_ENDPOINT, LOGTO_M2M_APP_ID, LOGTO_M2M_APP_SECRET are required')
  }

  const res = await fetch(`${endpoint}/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      resource,
      scope: 'all',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to get M2M token: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return cachedToken.token
}

async function logtoFetch(path: string, options: RequestInit = {}) {
  const endpoint = process.env.LOGTO_ENDPOINT
  const token = await getM2MToken()

  const res = await fetch(`${endpoint}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Logto API error: ${res.status} ${text}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export async function assignRole(userId: string, roleId: string) {
  return logtoFetch(`/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roleIds: [roleId] }),
  })
}

export async function removeRole(userId: string, roleId: string) {
  return logtoFetch(`/users/${userId}/roles/${roleId}`, {
    method: 'DELETE',
  })
}

export async function createUser(email: string, name?: string) {
  return logtoFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      primaryEmail: email,
      name: name || email.split('@')[0],
    }),
  })
}

export async function listUsers(search?: string, page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(limit),
  })
  if (search) params.set('search', search)

  return logtoFetch(`/users?${params}`)
}

export async function getUser(userId: string) {
  return logtoFetch(`/users/${userId}`)
}
