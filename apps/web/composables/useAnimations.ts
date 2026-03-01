import { type Ref, computed } from 'vue'

export type AnimationStyle = 'neon' | 'paper' | 'vapor' | 'brutal' | 'soft'

export interface AnimationPreset {
  entrance: Record<string, any>
  exit: Record<string, any>
  hover: Record<string, any>
  stagger: number
  spring: { stiffness: number; damping: number }
}

const presets: Record<AnimationStyle, AnimationPreset> = {
  neon: {
    entrance: { opacity: [0, 1], y: [20, 0], filter: ['blur(4px)', 'blur(0px)'] },
    exit: { opacity: [1, 0], y: [0, -20], filter: ['blur(0px)', 'blur(4px)'] },
    hover: { scale: 1.02, boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)' },
    stagger: 0.08,
    spring: { stiffness: 200, damping: 20 },
  },
  paper: {
    entrance: { opacity: [0, 1], rotate: [-2, 0], y: [10, 0] },
    exit: { opacity: [1, 0], rotate: [0, 2], y: [0, -10] },
    hover: { rotate: -1, y: -2, boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.12)' },
    stagger: 0.12,
    spring: { stiffness: 150, damping: 15 },
  },
  vapor: {
    entrance: { opacity: [0, 1], scale: [0.9, 1], rotateY: [10, 0] },
    exit: { opacity: [1, 0], scale: [1, 0.9], rotateY: [0, -10] },
    hover: { scale: 1.03, rotateY: 5 },
    stagger: 0.06,
    spring: { stiffness: 250, damping: 25 },
  },
  brutal: {
    entrance: { opacity: [0, 1] },
    exit: { opacity: [1, 0] },
    hover: { x: 2, y: 2 },
    stagger: 0,
    spring: { stiffness: 500, damping: 35 },
  },
  soft: {
    entrance: { opacity: [0, 1], y: [30, 0], scale: [0.98, 1] },
    exit: { opacity: [1, 0], y: [0, -15], scale: [1, 0.98] },
    hover: { scale: 1.01, y: -2 },
    stagger: 0.1,
    spring: { stiffness: 120, damping: 14 },
  },
}

export function useAnimations(style: Ref<AnimationStyle> | AnimationStyle) {
  const preset = computed(() => {
    const s = typeof style === 'string' ? style : style.value
    return presets[s]
  })

  return {
    preset,
    entrance: computed(() => preset.value.entrance),
    exit: computed(() => preset.value.exit),
    hover: computed(() => preset.value.hover),
    stagger: computed(() => preset.value.stagger),
    spring: computed(() => preset.value.spring),
  }
}
