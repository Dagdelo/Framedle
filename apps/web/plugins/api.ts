import { createFramedleClient, type FramedleClient } from '@framedle/api-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const auth = useAuth()

  const client = createFramedleClient(config.public.apiUrl as string, {
    getAccessToken: () => auth.getAccessToken(),
  })

  return {
    provide: {
      api: client,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $api: FramedleClient
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: FramedleClient
  }
}
