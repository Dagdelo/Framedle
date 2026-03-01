import type { Guess, GuessResult, DailyGameResponse, FramedleClient } from '@framedle/api-client'

const MAX_GUESSES = 6

export function useGameState() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const dailyGame = ref<DailyGameResponse | null>(null)
  const currentFrameUrl = ref('')
  const revealedFrames = ref<string[]>([])
  const guesses = ref<Guess[]>([])
  const score = ref(0)
  const gameOver = ref(false)
  const won = ref(false)
  const answer = ref<string | null>(null)

  const { fingerprint } = useFingerprint()
  const guessesRemaining = computed(() => MAX_GUESSES - guesses.value.length)

  async function loadGame() {
    loading.value = true
    error.value = null

    try {
      const $api = useNuxtApp().$api as FramedleClient
      const res = await $api.game.getDaily()

      if (res.error) {
        error.value = res.error.message
        return
      }

      if (res.data) {
        dailyGame.value = res.data
        currentFrameUrl.value = res.data.frames[0] ?? ''
        revealedFrames.value = [res.data.frames[0] ?? '']
      }
    } catch {
      error.value = 'Failed to load game'
    } finally {
      loading.value = false
    }
  }

  async function submitGuess(text: string): Promise<GuessResult | null> {
    if (!dailyGame.value || gameOver.value) return null

    try {
      const $api = useNuxtApp().$api as FramedleClient
      const res = await $api.game.submitGuess({
        dailyGameId: dailyGame.value.id,
        guess: text,
        fingerprint: fingerprint.value,
      })

      if (res.error) {
        error.value = res.error.message
        return null
      }

      if (res.data) {
        const result = res.data
        guesses.value = [...guesses.value, result.guess]
        score.value = result.score
        gameOver.value = result.gameOver
        won.value = result.won

        if (result.answer) {
          answer.value = result.answer
        }

        if (result.nextFrameUrl) {
          revealedFrames.value = [...revealedFrames.value, result.nextFrameUrl]
          currentFrameUrl.value = result.nextFrameUrl
        }

        return result
      }
    } catch {
      error.value = 'Failed to submit guess'
    }

    return null
  }

  async function skipGuess(): Promise<GuessResult | null> {
    return submitGuess('(skipped)')
  }

  function shareResult(): string {
    const grid = guesses.value
      .map((g) => (g.correct ? '🟩' : '🟥'))
      .join('')
    return grid
  }

  function getShareText(): string {
    const gameNum = dailyGame.value?.gameNumber ?? '?'
    const grid = shareResult()
    return `Framedle #${gameNum}\n${grid}\n${guesses.value.length}/${MAX_GUESSES} guesses | Score: ${score.value}`
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    dailyGame: readonly(dailyGame),
    currentFrameUrl: readonly(currentFrameUrl),
    revealedFrames: readonly(revealedFrames),
    guesses: readonly(guesses),
    guessesRemaining,
    score: readonly(score),
    gameOver: readonly(gameOver),
    won: readonly(won),
    answer: readonly(answer),
    loadGame,
    submitGuess,
    skipGuess,
    shareResult,
    getShareText,
  }
}
