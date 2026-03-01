export interface AuthUser {
  sub: string
  roles: string[]
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser | null
  }
}
