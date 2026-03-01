const STORAGE_KEY = 'framedle_fingerprint'

export function useFingerprint() {
  const fingerprint = ref('')

  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      fingerprint.value = stored
    } else {
      const id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
      fingerprint.value = id
    }
  }

  return { fingerprint: readonly(fingerprint) }
}
