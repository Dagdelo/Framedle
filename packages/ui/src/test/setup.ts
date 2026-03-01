// Global test setup for @framedle/ui
// Runs before each test file in the happy-dom environment.
import { config } from '@vue/test-utils'

// Suppress Vue warnings about missing router in unit tests.
config.global.stubs = {
  RouterLink: { template: '<a><slot /></a>' },
  NuxtLink: { template: '<a><slot /></a>' },
}
