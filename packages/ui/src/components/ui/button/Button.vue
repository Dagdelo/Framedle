<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-variant-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-variant-accent text-variant-bg shadow-variant hover:opacity-90',
        destructive: 'bg-variant-incorrect text-white shadow-sm hover:opacity-90',
        outline: 'border border-variant-border bg-transparent shadow-sm hover:bg-variant-muted',
        secondary: 'bg-variant-muted text-variant-fg shadow-sm hover:opacity-80',
        ghost: 'hover:bg-variant-muted',
        link: 'text-variant-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

const props = withDefaults(defineProps<{
  variant?: NonNullable<ButtonVariants['variant']>
  size?: NonNullable<ButtonVariants['size']>
  class?: HTMLAttributes['class']
  disabled?: boolean
}>(), {
  variant: 'default',
  size: 'default',
})

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props
  return rest
})
</script>

<template>
  <button
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
