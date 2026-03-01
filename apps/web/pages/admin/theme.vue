<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { updateTheme, getConfig } = useAdmin()

const variants = [
  { id: 1, name: 'Neon Cinema', desc: 'Dark, cyan/magenta neon, arcade marquee', colors: ['#0a0a0a', '#00f0ff', '#ff00aa'] },
  { id: 2, name: 'Paper Cut', desc: 'Cream, handcrafted, torn paper, polaroids', colors: ['#fdf6e3', '#d4a373', '#e07a5f'] },
  { id: 3, name: 'Vapor Grid', desc: 'Purple gradients, CRT scanlines, synthwave', colors: ['#0d0221', '#b829dd', '#ff6ec7'] },
  { id: 4, name: 'Brutal Mono', desc: 'B&W, monospace, zero radius, terminal', colors: ['#ffffff', '#000000', '#888888'] },
  { id: 5, name: 'Soft Focus', desc: 'Charcoal, frosted glass, amber, premium', colors: ['#1a1a2e', '#e2b53f', '#5a5a7a'] },
]

const activeId = ref(1)
const loading = ref(true)
const saving = ref(false)
const message = ref('')

onMounted(async () => {
  try {
    const res = await getConfig()
    if (res.data) {
      const themeCfg = res.data.find((c) => c.key === 'active_theme')
      if (themeCfg && themeCfg.value) {
        const vid = (themeCfg.value as { variantId?: number }).variantId
        if (vid && vid >= 1 && vid <= 5) activeId.value = vid
      }
    }
  } catch {
    // Keep default
  } finally {
    loading.value = false
  }
})

async function publish(id: number) {
  saving.value = true
  message.value = ''

  try {
    const res = await updateTheme(id)
    if (res.error) {
      message.value = `Error: ${res.error.message}`
    } else {
      activeId.value = id
      message.value = `Theme updated to V${id}`
    }
  } catch {
    message.value = 'Failed to update theme'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Theme Switcher</h1>
      <p v-if="message" class="text-sm" :class="message.startsWith('Error') ? 'text-red-400' : 'text-green-400'">
        {{ message }}
      </p>
    </div>

    <div v-if="loading" class="text-zinc-400">Loading...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="v in variants"
        :key="v.id"
        class="bg-zinc-900 border rounded-lg p-5 transition-all"
        :class="activeId === v.id ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-zinc-800 hover:border-zinc-700'"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-white">V{{ v.id }} — {{ v.name }}</h3>
          <span
            v-if="activeId === v.id"
            class="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-medium"
          >
            Active
          </span>
        </div>

        <p class="text-sm text-zinc-400 mb-4">{{ v.desc }}</p>

        <!-- Color swatches -->
        <div class="flex gap-2 mb-4">
          <div
            v-for="(color, i) in v.colors"
            :key="i"
            class="w-8 h-8 rounded-md border border-zinc-700"
            :style="{ backgroundColor: color }"
          />
        </div>

        <div class="flex gap-2">
          <button
            class="flex-1 px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="activeId === v.id
              ? 'bg-zinc-800 text-zinc-400 cursor-default'
              : 'bg-blue-600 hover:bg-blue-500 text-white'"
            :disabled="activeId === v.id || saving"
            @click="publish(v.id)"
          >
            {{ activeId === v.id ? 'Current' : saving ? 'Saving...' : 'Publish' }}
          </button>
          <a
            :href="`/?variant=${v.id}`"
            target="_blank"
            class="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
          >
            Preview
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
