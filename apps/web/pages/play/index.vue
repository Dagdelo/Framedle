<script setup lang="ts">
const modes = [
  { id: 'daily-frame', name: 'Daily Frame', description: 'Guess the video from 6 frames', icon: '🎬', active: true },
  { id: 'clip-guesser', name: 'Clip Guesser', description: 'Identify the video from a short clip', icon: '🎥', active: false },
  { id: 'channel-check', name: 'Channel Check', description: 'Match the video to its channel', icon: '📡', active: false },
  { id: 'thumbnail-theater', name: 'Thumbnail Theater', description: 'Guess from the thumbnail', icon: '🖼', active: false },
  { id: 'comment-detective', name: 'Comment Detective', description: 'Identify from comments', icon: '🔍', active: false },
  { id: 'title-scramble', name: 'Title Scramble', description: 'Unscramble the video title', icon: '📝', active: false },
]
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0f] text-white">
    <div class="max-w-2xl mx-auto px-6 py-16">
      <h1 class="text-3xl font-bold tracking-tight mb-2">Game Modes</h1>
      <p class="text-white/40 text-sm mb-10">Choose a mode to play</p>

      <div class="flex flex-col gap-3">
        <NuxtLink
          v-for="mode in modes"
          :key="mode.id"
          :to="mode.active ? `/play/${mode.id}` : undefined"
          class="rounded-xl border px-6 py-5 flex items-center gap-4 transition-all duration-200"
          :class="mode.active
            ? 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20 cursor-pointer'
            : 'bg-white/2 border-white/5 opacity-50 cursor-not-allowed'"
        >
          <span class="text-2xl" aria-hidden="true">{{ mode.icon }}</span>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium tracking-wide">{{ mode.name }}</span>
              <span
                v-if="!mode.active"
                class="text-[10px] uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded-full"
              >
                Coming Soon
              </span>
            </div>
            <p class="text-xs text-white/35 mt-0.5">{{ mode.description }}</p>
          </div>
          <span v-if="mode.active" class="text-white/30 text-sm">→</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
