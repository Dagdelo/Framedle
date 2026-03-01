<script setup lang="ts">
import { NeonCinemaLayout, NeonCinemaGameBoard } from '~/variants/v1'
import { PaperCutLayout, PaperCutGameBoard } from '~/variants/v2'
import { VaporGridLayout, VaporGridGameBoard } from '~/variants/v3'
import { BrutalMonoLayout, BrutalMonoGameBoard } from '~/variants/v4'
import { SoftFocusLayout, SoftFocusGameBoard } from '~/variants/v5'

const route = useRoute()
const mode = route.params.mode as string

// Only daily-frame is active for MVP
if (mode !== 'daily-frame') {
  navigateTo('/play')
}

const { activeVariantId } = useTheme()

const layoutComponents: Record<number, any> = {
  1: NeonCinemaLayout,
  2: PaperCutLayout,
  3: VaporGridLayout,
  4: BrutalMonoLayout,
  5: SoftFocusLayout,
}

const gameBoardComponents: Record<number, any> = {
  1: NeonCinemaGameBoard,
  2: PaperCutGameBoard,
  3: VaporGridGameBoard,
  4: BrutalMonoGameBoard,
  5: SoftFocusGameBoard,
}
</script>

<template>
  <div>
    <Head>
      <Title>Framedle — Play Daily Frame</Title>
    </Head>
    <component :is="layoutComponents[activeVariantId]">
      <component :is="gameBoardComponents[activeVariantId]" />
    </component>
  </div>
</template>
