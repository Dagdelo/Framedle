<template>
  <div
    class="paper-cut-layout min-h-screen relative overflow-hidden"
    :style="cssVariables"
  >
    <!-- Paper texture overlay -->
    <div class="paper-texture absolute inset-0 pointer-events-none" aria-hidden="true" />

    <!-- Washi tape corners -->
    <div class="washi-tape washi-tape--tl" aria-hidden="true" />
    <div class="washi-tape washi-tape--tr" aria-hidden="true" />
    <div class="washi-tape washi-tape--bl" aria-hidden="true" />
    <div class="washi-tape washi-tape--br" aria-hidden="true" />

    <!-- Torn paper header strip -->
    <header class="paper-header relative z-10 w-full pt-5 pb-3 px-8">
      <div class="torn-strip relative">
        <div class="torn-edge torn-edge--top" aria-hidden="true" />
        <div class="torn-edge torn-edge--bottom" aria-hidden="true" />
        <div class="flex items-center gap-4 py-3 px-6">
          <h1 class="font-handwritten text-3xl tracking-wide" style="color: var(--variant-fg)">
            Framedle
          </h1>
          <span
            class="font-serif-body text-xs italic"
            style="color: var(--variant-fg-muted)"
          >
            daily · guessing · game
          </span>
        </div>
      </div>
    </header>

    <!-- Asymmetric content area: extra left margin for scrapbook feel -->
    <main class="relative z-10 pl-10 pr-6 md:pl-16 md:pr-10 pb-16">
      <slot />
    </main>

    <!-- Footer strip -->
    <footer class="relative z-10 pb-6 px-10">
      <div
        class="font-handwritten text-xs text-center"
        style="color: var(--variant-fg-muted)"
      >
        handcrafted with care · {{ new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useDesignVariant } from '~/composables/useDesignVariant'

const { cssVariables } = useDesignVariant()
</script>

<style scoped>
/* ── Background & texture ── */
.paper-cut-layout {
  background-color: var(--variant-bg);
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
}

.paper-texture {
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 28px,
      rgba(196, 169, 125, 0.06) 28px,
      rgba(196, 169, 125, 0.06) 29px
    );
}

/* ── Washi tape corners ── */
.washi-tape {
  position: absolute;
  width: 72px;
  height: 20px;
  border-radius: 1px;
  z-index: 20;
  opacity: 0.75;
}

.washi-tape--tl {
  top: 18px;
  left: -6px;
  background-color: #c46d3e;
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 6px,
    rgba(255,255,255,0.18) 6px,
    rgba(255,255,255,0.18) 7px
  );
  transform: rotate(-12deg);
  box-shadow: 1px 1px 0 rgba(0,0,0,0.10);
}

.washi-tape--tr {
  top: 14px;
  right: -4px;
  background-color: #6b7c4e;
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 8px,
    rgba(255,255,255,0.15) 8px,
    rgba(255,255,255,0.15) 9px
  );
  transform: rotate(10deg);
  box-shadow: 1px 1px 0 rgba(0,0,0,0.10);
}

.washi-tape--bl {
  bottom: 40px;
  left: -4px;
  width: 56px;
  background-color: #6b8fad;
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 5px,
    rgba(255,255,255,0.20) 5px,
    rgba(255,255,255,0.20) 6px
  );
  transform: rotate(8deg);
  box-shadow: 1px 1px 0 rgba(0,0,0,0.08);
}

.washi-tape--br {
  bottom: 50px;
  right: -5px;
  width: 64px;
  background-color: #c46d3e;
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 7px,
    rgba(255,255,255,0.16) 7px,
    rgba(255,255,255,0.16) 8px
  );
  transform: rotate(-9deg);
  box-shadow: 1px 1px 0 rgba(0,0,0,0.08);
}

/* ── Torn paper header strip ── */
.torn-strip {
  background-color: var(--variant-bg-secondary);
  border-radius: 1px;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.07), 0 1px 0 rgba(196,169,125,0.3);
}

.torn-edge {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  overflow: hidden;
  pointer-events: none;
}

.torn-edge--top {
  top: -5px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='6'%3E%3Cpath d='M0 6 Q2 0 5 4 Q8 8 10 3 Q12 0 15 5 Q17 8 20 6 L20 6 L0 6Z' fill='%23f5ead0'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 20px 6px;
}

.torn-edge--bottom {
  bottom: -5px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='6'%3E%3Cpath d='M0 0 Q2 6 5 2 Q8 -2 10 3 Q12 6 15 1 Q17 -2 20 0 L20 0 L0 0Z' fill='%23f5ead0'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 20px 6px;
}
</style>
