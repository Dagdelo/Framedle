import type { FramedleClient } from '@framedle/api-client'
import type { SiteConfig } from '@framedle/api-client'

export function useTheme() {
  const activeVariantId = ref<number>(1)
  const loading = ref(true)

  async function fetchTheme() {
    try {
      const $api = useNuxtApp().$api as FramedleClient
      const res = await $api.admin.getConfig()
      if (res.data) {
        const themeConfig = res.data.find((c: SiteConfig) => c.key === 'active_theme')
        if (themeConfig && themeConfig.value) {
          const vid = (themeConfig.value as { variantId?: number }).variantId
          if (vid && vid >= 1 && vid <= 5) {
            activeVariantId.value = vid
          }
        }
      }
    } catch {
      // Fall back to variant 1 if API unreachable
    } finally {
      loading.value = false
    }
  }

  if (import.meta.client) {
    fetchTheme()
  } else {
    loading.value = false
  }

  return { activeVariantId: readonly(activeVariantId), loading: readonly(loading), fetchTheme }
}
