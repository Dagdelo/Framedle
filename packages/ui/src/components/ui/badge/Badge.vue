<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-variant border border-variant-border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-variant-accent text-variant-bg',
        secondary: 'border-transparent bg-variant-muted text-variant-fg',
        destructive: 'border-transparent bg-variant-incorrect text-white',
        outline: 'text-variant-fg',
        correct: 'border-transparent bg-variant-correct text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

type BadgeVariants = VariantProps<typeof badgeVariants>

const props = defineProps<{
  variant?: NonNullable<BadgeVariants['variant']>
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
