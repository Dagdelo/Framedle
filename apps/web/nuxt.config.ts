export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,
  compatibilityDate: '2025-01-01',

  css: ['~/assets/css/animations.css'],

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
  ],

  googleFonts: {
    families: {
      'Bebas Neue': true,
      'Caveat': [400, 700],
      'Lora': [400, 500, 600, 700],
      'Space Grotesk': [400, 500, 600, 700],
      'Orbitron': [400, 500, 600, 700, 800, 900],
      'JetBrains Mono': [400, 500, 600, 700],
      'Plus Jakarta Sans': [300, 400, 500, 600, 700],
      'Inter': [300, 400, 500, 600, 700],
    },
    display: 'swap',
    preload: true,
  },

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:4000',
    },
  },
})
