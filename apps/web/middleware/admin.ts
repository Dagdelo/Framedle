export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/admin/login') return

  if (import.meta.client) {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      return navigateTo('/admin/login')
    }
  }
})
