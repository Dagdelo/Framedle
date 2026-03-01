<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const variants = [
  { id: 1, name: 'Neon Cinema', emoji: '🎬' },
  { id: 2, name: 'Paper Cut', emoji: '✂️' },
  { id: 3, name: 'Vapor Grid', emoji: '🌆' },
  { id: 4, name: 'Brutal Mono', emoji: '⌨️' },
  { id: 5, name: 'Soft Focus', emoji: '✨' },
]

const currentVariant = computed(() => {
  const v = Number(route.query.variant)
  return v >= 1 && v <= 5 ? v : 1
})

function goTo(id: number) {
  router.push({ query: { variant: String(id) } })
}

function prev() {
  const next = currentVariant.value <= 1 ? 5 : currentVariant.value - 1
  goTo(next)
}

function next() {
  const next = currentVariant.value >= 5 ? 1 : currentVariant.value + 1
  goTo(next)
}

const currentName = computed(() => variants.find(v => v.id === currentVariant.value)?.name ?? '')
</script>

<template>
  <div class="variant-paginator">
    <button class="pag-btn pag-arrow" title="Previous variant" @click="prev">&larr;</button>

    <div class="pag-dots">
      <button
        v-for="v in variants"
        :key="v.id"
        class="pag-dot"
        :class="{ active: v.id === currentVariant }"
        :title="`${v.name} (V${v.id})`"
        @click="goTo(v.id)"
      >
        {{ v.emoji }}
      </button>
    </div>

    <button class="pag-btn pag-arrow" title="Next variant" @click="next">&rarr;</button>

    <span class="pag-label">{{ currentName }}</span>

    <NuxtLink to="/compare" class="pag-btn pag-compare" title="Compare all">
      ⊞
    </NuxtLink>
  </div>
</template>

<style scoped>
.variant-paginator {
  position: fixed;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 99px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: system-ui, -apple-system, sans-serif;
  user-select: none;
}

.pag-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s ease;
  text-decoration: none;
}

.pag-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.pag-dots {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pag-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s ease;
  filter: grayscale(0.8);
  opacity: 0.6;
}

.pag-dot:hover {
  filter: grayscale(0);
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.1);
}

.pag-dot.active {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.15);
  filter: grayscale(0);
  opacity: 1;
  transform: scale(1.1);
}

.pag-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  min-width: 5.5rem;
  text-align: center;
}

.pag-compare {
  font-size: 1rem;
  font-weight: 700;
}
</style>
