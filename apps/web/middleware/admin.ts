export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo(`/api/auth/sign-in?returnTo=${encodeURIComponent(to.fullPath)}`, { external: true })
  }

  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
