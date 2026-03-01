<script setup lang="ts">
import { v1Theme } from '~/variants/v1/theme'
import { v2Theme } from '~/variants/v2/theme'
import { v3Theme } from '~/variants/v3/theme'
import { v4Theme } from '~/variants/v4/theme'
import { v5Theme } from '~/variants/v5/theme'
import type { VariantTheme } from '~/variants/types'

const themes: VariantTheme[] = [v1Theme, v2Theme, v3Theme, v4Theme, v5Theme]

function swatchColors(theme: VariantTheme): string[] {
  return [
    theme.colors.bg,
    theme.colors.accent,
    theme.colors.accent2,
    theme.colors.accent3,
    theme.colors.fg,
  ]
}

function animationLabel(animation: VariantTheme['animation']): string {
  const labels: Record<VariantTheme['animation'], string> = {
    neon: 'Neon glow pulses',
    paper: 'Paper fold & tear',
    vapor: 'Scanline drift',
    brutal: 'Hard snap transitions',
    soft: 'Smooth spring easing',
  }
  return labels[animation]
}
</script>

<template>
  <div class="compare-page">
    <Head>
      <Title>Compare Design Variants — Framedle</Title>
    </Head>

    <header class="compare-header">
      <h1 class="compare-title">Compare Design Variants</h1>
      <p class="compare-subtitle">
        Five visual identities for Framedle. Pick one to preview.
      </p>
    </header>

    <main class="compare-grid">
      <article
        v-for="theme in themes"
        :key="theme.id"
        class="variant-card"
      >
        <div class="card-number">V{{ theme.id }}</div>

        <div class="card-header">
          <h2 class="card-name">{{ theme.name }}</h2>
          <p class="card-description">{{ theme.description }}</p>
        </div>

        <div class="card-swatches">
          <span
            v-for="(color, i) in swatchColors(theme)"
            :key="i"
            class="swatch"
            :style="{ backgroundColor: color }"
            :title="color"
          />
        </div>

        <dl class="card-meta">
          <div class="meta-row">
            <dt>Heading</dt>
            <dd>{{ theme.fonts.heading }}</dd>
          </div>
          <div class="meta-row">
            <dt>Body</dt>
            <dd>{{ theme.fonts.body }}</dd>
          </div>
          <div class="meta-row">
            <dt>Radius</dt>
            <dd>{{ theme.radius }}</dd>
          </div>
          <div class="meta-row">
            <dt>Animation</dt>
            <dd>{{ animationLabel(theme.animation) }}</dd>
          </div>
        </dl>

        <NuxtLink
          :to="`/?variant=${theme.id}`"
          class="card-preview-link"
        >
          Preview &rarr;
        </NuxtLink>
      </article>
    </main>
  </div>
</template>

<style scoped>
.compare-page {
  min-height: 100vh;
  background-color: #0d0d0d;
  color: #e0e0e0;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
  padding: 3rem 1.5rem 6rem;
}

.compare-header {
  max-width: 800px;
  margin: 0 auto 3rem;
  text-align: center;
}

.compare-title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin-bottom: 0.75rem;
}

.compare-subtitle {
  font-size: 0.95rem;
  color: #666;
}

.compare-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .compare-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .compare-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.variant-card {
  background-color: #161616;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: relative;
  transition: border-color 0.15s ease;
}

.variant-card:hover {
  border-color: #444;
}

.card-number {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #444;
  letter-spacing: 0.08em;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.card-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.01em;
}

.card-description {
  font-size: 0.8rem;
  color: #888;
  line-height: 1.5;
  margin: 0;
}

.card-swatches {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.swatch {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.meta-row dt {
  color: #555;
  min-width: 5.5rem;
  flex-shrink: 0;
}

.meta-row dd {
  color: #aaa;
  margin: 0;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-preview-link {
  display: inline-block;
  margin-top: auto;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #222;
  border: 1px solid #333;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.card-preview-link:hover {
  background-color: #2a2a2a;
  border-color: #555;
}
</style>
