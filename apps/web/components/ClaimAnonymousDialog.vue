<script setup lang="ts">
import type { FramedleClient } from '@framedle/api-client'

const STORAGE_KEY = 'framedle_fingerprint'

const { isAuthenticated } = useAuth()
const { $api } = useNuxtApp()

const visible = ref(false)
const fingerprint = ref('')
const merging = ref(false)
const mergeError = ref<string | null>(null)
const mergeSuccess = ref(false)
const mergeResult = ref<{ xpTransferred: number; achievementsMerged: number } | null>(null)

watch(isAuthenticated, (authed) => {
  if (!authed) return
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      fingerprint.value = stored
      visible.value = true
    }
  }
}, { immediate: true })

async function merge() {
  merging.value = true
  mergeError.value = null

  try {
    const res = await ($api as FramedleClient).user.claimAnonymous(fingerprint.value)
    if (res.error) {
      mergeError.value = res.error.message
    } else if (res.data) {
      mergeResult.value = {
        xpTransferred: res.data.xpTransferred,
        achievementsMerged: res.data.achievementsMerged,
      }
      mergeSuccess.value = true
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    mergeError.value = 'Something went wrong. Please try again.'
  } finally {
    merging.value = false
  }
}

function skip() {
  visible.value = false
}

function dismiss() {
  visible.value = false
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    >
      <div class="w-full max-w-sm rounded-xl bg-variant-surface p-6 shadow-xl">
        <template v-if="!mergeSuccess">
          <h2 class="mb-2 text-lg font-bold">Game History Found</h2>
          <p class="mb-5 text-sm text-variant-muted">
            We found game history from this device. Would you like to merge it into your account?
          </p>

          <p v-if="mergeError" class="mb-3 text-sm text-red-500">{{ mergeError }}</p>

          <div class="flex gap-3">
            <button
              class="flex-1 rounded-lg bg-variant-accent px-4 py-2 text-sm font-semibold text-variant-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
              :disabled="merging"
              @click="merge"
            >
              {{ merging ? 'Merging…' : 'Merge History' }}
            </button>
            <button
              class="rounded-lg border border-variant-border px-4 py-2 text-sm font-medium transition-colors hover:bg-variant-hover disabled:opacity-50"
              :disabled="merging"
              @click="skip"
            >
              Skip
            </button>
          </div>
        </template>

        <template v-else>
          <h2 class="mb-2 text-lg font-bold">History Merged!</h2>
          <p class="mb-1 text-sm text-variant-muted">
            Your game history has been merged into your account.
          </p>
          <ul v-if="mergeResult" class="mb-5 mt-3 space-y-1 text-sm">
            <li v-if="mergeResult.xpTransferred > 0">+{{ mergeResult.xpTransferred }} XP transferred</li>
            <li v-if="mergeResult.achievementsMerged > 0">{{ mergeResult.achievementsMerged }} achievement(s) merged</li>
          </ul>
          <button
            class="w-full rounded-lg bg-variant-accent px-4 py-2 text-sm font-semibold text-variant-accent-fg transition-opacity hover:opacity-90"
            @click="dismiss"
          >
            Done
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>
