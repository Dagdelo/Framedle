import { createFramedleClient, type FramedleClient } from '@framedle/api-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const client = createFramedleClient(config.public.apiUrl as string)

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
