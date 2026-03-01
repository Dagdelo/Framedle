<template>
  <div class="min-h-screen bg-[#1a1a2e] relative overflow-x-hidden">
    <!-- Subtle radial gradient overlay for depth -->
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(42,157,143,0.06)_0%,transparent_70%)]"
      aria-hidden="true"
    />

    <!-- Frosted glass navigation bar -->
    <header
      class="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/5 border-b border-white/10 transition-all duration-300"
    >
      <div class="mx-auto max-w-4xl flex items-center justify-between px-8 py-4">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <span class="font-['Plus_Jakarta_Sans'] text-xl font-light tracking-widest text-white/90 select-none">
            Framedle
          </span>
          <span class="w-1.5 h-1.5 rounded-full bg-[#f4a261] inline-block mb-0.5" aria-hidden="true" />
        </div>

        <!-- Nav links -->
        <nav class="hidden sm:flex items-center gap-6">
          <slot name="nav">
            <a
              href="/"
              class="text-sm font-light text-white/50 hover:text-white/90 transition-colors duration-300 tracking-wide"
            >
              Play
            </a>
            <a
              href="/leaderboard"
              class="text-sm font-light text-white/50 hover:text-white/90 transition-colors duration-300 tracking-wide"
            >
              Leaderboard
            </a>
            <a
              href="/modes"
              class="text-sm font-light text-white/50 hover:text-white/90 transition-colors duration-300 tracking-wide"
            >
              Modes
            </a>
          </slot>
        </nav>

        <!-- Auth / profile slot -->
        <div class="flex items-center gap-3">
          <slot name="auth">
            <button
              class="rounded-full px-4 py-1.5 text-sm font-light tracking-wide text-white/70 border border-white/10 hover:bg-white/10 hover:text-white/90 transition-all duration-300"
            >
              Sign in
            </button>
          </slot>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="mx-auto max-w-4xl px-8 py-10 transition-all duration-300">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="mx-auto max-w-4xl px-8 pb-10 pt-4 border-t border-white/5">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <span class="text-xs font-light text-white/25 tracking-widest">
          &copy; 2026 Framedle
        </span>
        <div class="flex items-center gap-5">
          <a
            href="/privacy"
            class="text-xs font-light text-white/25 hover:text-white/50 transition-colors duration-300 tracking-wide"
          >
            Privacy
          </a>
          <a
            href="/terms"
            class="text-xs font-light text-white/25 hover:text-white/50 transition-colors duration-300 tracking-wide"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Layout.vue — Soft Focus v5
// Deep charcoal shell with frosted glass nav, generous spacing, Apple TV-meets-Netflix feel.
</script>
