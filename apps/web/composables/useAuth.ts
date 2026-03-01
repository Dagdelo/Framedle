export interface AuthUser {
  id: string
  email?: string
  displayName?: string
  avatarUrl?: string
  roles: string[]
}

interface SessionResponse {
  authenticated: boolean
  user?: AuthUser
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)

  // useAsyncData with a stable key ensures SSR data is reused on client hydration
  const { pending } = useAsyncData('auth:session', async () => {
    const data = await $fetch<SessionResponse>('/api/auth/session')
    user.value = data.authenticated ? (data.user ?? null) : null
  })

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.roles.includes('admin') ?? false)

  async function getAccessToken(): Promise<string | null> {
    try {
      const { accessToken } = await $fetch<{ accessToken: string }>('/api/auth/token')
      return accessToken
    } catch {
      user.value = null
      return null
    }
  }

  function signIn(returnTo?: string) {
    const path = returnTo
      ? `/api/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/sign-in'
    return navigateTo(path, { external: true })
  }

  function signOut() {
    return navigateTo('/api/auth/sign-out', { external: true })
  }

  return {
    user: readonly(user),
    loading: readonly(pending),
    isAuthenticated,
    isAdmin,
    getAccessToken,
    signIn,
    signOut,
  }
}
