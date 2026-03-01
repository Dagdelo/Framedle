<template>
  <section class="relative flex flex-col items-center text-center pt-16 pb-20 gap-14">
    <!-- Ambient glow: amber radial behind hero text -->
    <div
      class="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[320px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,162,97,0.10)_0%,transparent_70%)] blur-2xl"
      aria-hidden="true"
    />

    <!-- Hero headline + tagline -->
    <div class="relative flex flex-col items-center gap-5">
      <h1
        class="font-['Plus_Jakarta_Sans'] text-5xl font-light tracking-wider text-white/95 leading-tight select-none"
      >
        Framedle
      </h1>
      <p class="font-['Inter'] text-base font-light tracking-wide text-white/40 max-w-xs leading-relaxed">
        Your daily YouTube challenge
      </p>
    </div>

    <!-- Main CTA frosted glass card -->
    <div
      class="relative w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 flex flex-col items-center gap-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
    >
      <!-- Subtle inner top-edge highlight -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />

      <div class="flex flex-col items-center gap-2 text-center">
        <span class="text-sm font-light text-white/50 tracking-widest uppercase">Daily Challenge</span>
        <p class="text-white/80 font-light text-base leading-relaxed max-w-xs">
          Guess the YouTube video from a single frame. Six chances. Share your streak.
        </p>
      </div>

      <!-- Streak / stats row -->
      <div class="flex items-center gap-8">
        <div class="flex flex-col items-center gap-0.5">
          <span class="text-2xl font-light text-[#f4a261] font-['Inter']">7</span>
          <span class="text-[10px] uppercase tracking-widest text-white/30 font-light">Streak</span>
        </div>
        <div class="w-px h-8 bg-white/10" aria-hidden="true" />
        <div class="flex flex-col items-center gap-0.5">
          <span class="text-2xl font-light text-white/70 font-['Inter']">1,248</span>
          <span class="text-[10px] uppercase tracking-widest text-white/30 font-light">Players today</span>
        </div>
        <div class="w-px h-8 bg-white/10" aria-hidden="true" />
        <div class="flex flex-col items-center gap-0.5">
          <span class="text-2xl font-light text-[#2a9d8f] font-['Inter']">12</span>
          <span class="text-[10px] uppercase tracking-widest text-white/30 font-light">Modes</span>
        </div>
      </div>

      <!-- Start Playing CTA -->
      <button
        class="mt-2 rounded-full bg-[#f4a261] px-8 py-3 text-sm font-medium tracking-wide text-[#1a1a2e] shadow-[0_4px_20px_rgba(244,162,97,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(244,162,97,0.45)] transition-all duration-300 select-none"
        @click="navigateTo('/play/daily-frame')"
      >
        Start Playing
      </button>
    </div>

    <!-- Featured modes — horizontal frosted glass scroll -->
    <div class="w-full flex flex-col items-start gap-3">
      <span class="text-xs uppercase tracking-widest text-white/25 font-light pl-1">Featured Modes</span>
      <div class="w-full overflow-x-auto pb-2 scrollbar-none">
        <div class="flex gap-3 w-max">
          <div
            v-for="mode in featuredModes"
            :key="mode.id"
            class="flex-shrink-0 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-4 flex flex-col gap-1.5 min-w-[148px] hover:bg-white/8 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer select-none"
          >
            <span class="text-lg" aria-hidden="true">{{ mode.icon }}</span>
            <span class="text-sm font-light text-white/80 tracking-wide">{{ mode.name }}</span>
            <span class="text-[11px] font-light text-white/35 leading-snug">{{ mode.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Hero.vue — Soft Focus v5
// Premium, calm, cinematic hero with ambient amber glow and frosted glass CTA card.

defineEmits<{ start: [] }>()

const featuredModes = [
  { id: 'classic',    icon: '🎬', name: 'Classic',    description: 'One frame, six guesses' },
  { id: 'lightning',  icon: '⚡', name: 'Lightning',  description: '30 seconds on the clock' },
  { id: 'audio',      icon: '🎵', name: 'Audio Only', description: 'No visuals — ears only' },
  { id: 'blur',       icon: '🌫️', name: 'Blur Rush',  description: 'Frame sharpens each guess' },
  { id: 'silhouette', icon: '🖤', name: 'Silhouette', description: 'Shadow reveal challenge' },
  { id: 'mosaic',     icon: '🎨', name: 'Mosaic',     description: 'Pixel art distortion' },
]
</script>

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
