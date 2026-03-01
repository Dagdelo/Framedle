<script setup lang="ts">
import { NeonCinemaLayout, NeonCinemaHero, NeonCinemaGameBoard } from '~/variants/v1'
import { PaperCutLayout, PaperCutHero, PaperCutGameBoard } from '~/variants/v2'
import { VaporGridLayout, VaporGridHero, VaporGridGameBoard } from '~/variants/v3'
import { BrutalMonoLayout, BrutalMonoHero, BrutalMonoGameBoard } from '~/variants/v4'
import { SoftFocusLayout, SoftFocusHero, SoftFocusGameBoard } from '~/variants/v5'

const { variantId } = useDesignVariant()

const layoutComponents: Record<number, any> = {
  1: NeonCinemaLayout,
  2: PaperCutLayout,
  3: VaporGridLayout,
  4: BrutalMonoLayout,
  5: SoftFocusLayout,
}

const heroComponents: Record<number, any> = {
  1: NeonCinemaHero,
  2: PaperCutHero,
  3: VaporGridHero,
  4: BrutalMonoHero,
  5: SoftFocusHero,
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
      <Title>Framedle — Daily YouTube Guessing Game</Title>
    </Head>
    <component :is="layoutComponents[variantId]">
      <component :is="heroComponents[variantId]" />
      <component :is="gameBoardComponents[variantId]" />
    </component>
  </div>
</template>
