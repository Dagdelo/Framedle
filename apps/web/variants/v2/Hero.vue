<template>
  <section class="paper-cut-hero pt-8 pb-12">

    <!-- Pinboard / corkboard backdrop -->
    <div class="corkboard relative mx-auto max-w-3xl rounded-sm px-8 py-10"
      style="background-color: #d4b896; box-shadow: inset 0 2px 8px rgba(0,0,0,0.15), 3px 3px 0 rgba(0,0,0,0.08);">

      <!-- Board texture overlay -->
      <div class="absolute inset-0 rounded-sm pointer-events-none corkboard-texture" aria-hidden="true" />

      <!-- Title card — pinned to corkboard -->
      <div class="title-card relative z-10 mb-8">
        <!-- Pin dot -->
        <div class="pin" aria-hidden="true" />

        <div
          class="bg-white px-6 py-5 inline-block"
          style="
            box-shadow: 4px 4px 0 rgba(0,0,0,0.10), 0 1px 0 rgba(0,0,0,0.05);
            transform: rotate(-2deg);
            border-radius: 1px;
          "
        >
          <h2
            class="font-handwritten text-6xl md:text-7xl leading-none"
            style="
              color: var(--variant-fg);
              text-decoration: underline;
              text-decoration-style: wavy;
              text-underline-offset: 6px;
              text-decoration-color: var(--variant-accent);
            "
          >
            Framedle
          </h2>
          <p
            class="font-serif-body text-base italic mt-3"
            style="color: var(--variant-fg-muted)"
          >
            A daily YouTube guessing game
          </p>
        </div>
      </div>

      <!-- Mode polaroid cards row -->
      <div class="flex flex-wrap gap-5 mb-10 relative z-10">
        <div
          v-for="(mode, i) in todaysModes"
          :key="mode.id"
          class="polaroid-card bg-white flex-shrink-0"
          :style="{
            transform: `rotate(${mode.rotation}deg)`,
            boxShadow: '3px 3px 0 rgba(0,0,0,0.12), 0 1px 0 rgba(0,0,0,0.06)',
            borderRadius: '1px',
            animationDelay: `${i * 0.15}s`,
          }"
        >
          <!-- Pin on each card -->
          <div class="pin pin--small" aria-hidden="true" />

          <!-- Thumbnail placeholder -->
          <div
            class="polaroid-thumb"
            :style="{ backgroundColor: mode.thumbColor }"
          >
            <span class="font-handwritten text-xs text-white opacity-70">{{ mode.emoji }}</span>
          </div>

          <!-- Handwritten caption -->
          <p
            class="font-handwritten text-sm text-center px-2 py-2 leading-tight"
            style="color: var(--variant-fg)"
          >
            {{ mode.label }}
          </p>
        </div>
      </div>

      <!-- CTA: kraft paper tag -->
      <div class="relative z-10 flex items-center gap-3">
        <div class="kraft-tag-wrapper relative">
          <!-- String line -->
          <div
            class="tag-string"
            aria-hidden="true"
          />

          <button
            class="kraft-tag font-handwritten text-xl px-8 py-3 relative transition-all duration-200"
            style="
              background-color: #c9a96e;
              color: var(--variant-fg);
              border: 1.5px solid rgba(0,0,0,0.15);
              border-radius: 3px;
              box-shadow: 3px 3px 0 rgba(0,0,0,0.12);
            "
            @mouseenter="tagHovered = true"
            @mouseleave="tagHovered = false"
            @click="navigateTo('/play/daily-frame')"
            :style="[
              {
                backgroundColor: '#c9a96e',
                color: 'var(--variant-fg)',
                border: '1.5px solid rgba(0,0,0,0.15)',
                borderRadius: '3px',
                boxShadow: tagHovered
                  ? '5px 5px 0 rgba(0,0,0,0.15)'
                  : '3px 3px 0 rgba(0,0,0,0.12)',
                transform: tagHovered ? 'translateY(-2px) rotate(-1deg)' : 'rotate(0deg)',
                transition: 'all 0.15s ease',
              }
            ]"
          >
            Play Today's Game →
            <!-- Tag hole -->
            <span
              class="tag-hole"
              aria-hidden="true"
            />
          </button>
        </div>

        <span
          class="font-handwritten text-sm italic"
          style="color: rgba(45,36,22,0.5); transform: rotate(2deg); display: inline-block;"
        >
          free · daily · no spoilers
        </span>
      </div>

    </div><!-- /corkboard -->

  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const tagHovered = ref(false)

const todaysModes = [
  { id: 1, label: 'Classic', emoji: '🎬', rotation: -2, thumbColor: '#c46d3e' },
  { id: 2, label: 'Audio Only', emoji: '🎵', rotation: 1.5, thumbColor: '#6b7c4e' },
  { id: 3, label: 'First Frame', emoji: '🎞️', rotation: -1, thumbColor: '#6b8fad' },
  { id: 4, label: 'Lyrics', emoji: '✍️', rotation: 2.5, thumbColor: '#c49a3e' },
]
</script>

<style scoped>
/* ── Corkboard texture ── */
.corkboard-texture {
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.3'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
}

/* ── Push-pin ── */
.pin {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  background: radial-gradient(circle at 35% 35%, #e06030, #8b3010);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3);
  z-index: 20;
}

.pin--small {
  width: 10px;
  height: 10px;
  top: -8px;
}

/* ── Polaroid card ── */
.polaroid-card {
  padding: 8px 8px 4px 8px;
  width: 110px;
}

.polaroid-thumb {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

/* ── Kraft tag ── */
.kraft-tag-wrapper {
  display: flex;
  align-items: center;
}

.tag-string {
  width: 28px;
  height: 1px;
  background-color: rgba(45, 36, 22, 0.35);
  margin-right: -2px;
}

.kraft-tag {
  position: relative;
}

.tag-hole {
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background-color: #d4b896;
  border: 1px solid rgba(0,0,0,0.20);
  border-radius: 50%;
}

/* ── Entrance animations ── */
.polaroid-card {
  animation: paper-unfold 0.4s ease-out both;
}

@keyframes paper-unfold {
  from {
    opacity: 0;
    transform: rotate(0deg) translateY(12px);
  }
  to {
    opacity: 1;
  }
}

.title-card {
  animation: gentle-float 0.5s ease-out both;
}

@keyframes gentle-float {
  from {
    opacity: 0;
    transform: rotate(-2deg) translateY(16px);
  }
  to {
    opacity: 1;
  }
}
</style>
