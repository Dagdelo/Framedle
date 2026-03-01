<template>
  <section class="brutal-hero font-mono-brutal">
    <!-- Title -->
    <h1 class="brutal-title">FRAMEDLE</h1>

    <!-- Tagline with blinking cursor -->
    <p class="brutal-tagline">
      <span class="brutal-prompt-char" aria-hidden="true">&gt;&nbsp;</span>
      <span>A daily YouTube guessing game</span>
      <span class="brutal-cursor animate-cursor-blink" aria-hidden="true">_</span>
    </p>

    <!-- Stats terminal box -->
    <div class="brutal-stats-box">
      <div class="brutal-stats-header" aria-hidden="true">
        <span>-- STATUS REPORT --</span>
      </div>
      <dl class="brutal-stats-list">
        <div class="brutal-stat-row">
          <dt class="brutal-stat-key">MODE</dt>
          <dd class="brutal-stat-val">daily-frame</dd>
        </div>
        <div class="brutal-stat-row">
          <dt class="brutal-stat-key">STATUS</dt>
          <dd class="brutal-stat-val brutal-stat-active">active</dd>
        </div>
        <div class="brutal-stat-row">
          <dt class="brutal-stat-key">PLAYERS</dt>
          <dd class="brutal-stat-val">1,247</dd>
        </div>
        <div class="brutal-stat-row">
          <dt class="brutal-stat-key">YOUR_STREAK</dt>
          <dd class="brutal-stat-val">0</dd>
        </div>
      </dl>
    </div>

    <!-- CTA -->
    <button class="brutal-cta-btn" type="button" @click="navigateTo('/play/daily-frame')">
      [PLAY]
    </button>

    <!-- Mode table -->
    <div class="brutal-modes-section">
      <div class="brutal-modes-label">SELECT_MODE:</div>
      <table class="brutal-modes-table" role="grid" aria-label="Game modes">
        <thead>
          <tr>
            <th class="brutal-th">ID</th>
            <th class="brutal-th">MODE</th>
            <th class="brutal-th">DIFFICULTY</th>
            <th class="brutal-th">STATUS</th>
          </tr>
        </thead>
        <tbody>
          <tr class="brutal-tr brutal-tr-active">
            <td class="brutal-td">01</td>
            <td class="brutal-td">daily-frame</td>
            <td class="brutal-td">MEDIUM</td>
            <td class="brutal-td brutal-status-open">OPEN</td>
          </tr>
          <tr class="brutal-tr">
            <td class="brutal-td">02</td>
            <td class="brutal-td">audio-only</td>
            <td class="brutal-td">HARD</td>
            <td class="brutal-td brutal-status-open">OPEN</td>
          </tr>
          <tr class="brutal-tr">
            <td class="brutal-td">03</td>
            <td class="brutal-td">speed-round</td>
            <td class="brutal-td">EASY</td>
            <td class="brutal-td brutal-status-open">OPEN</td>
          </tr>
          <tr class="brutal-tr">
            <td class="brutal-td">04</td>
            <td class="brutal-td">title-drop</td>
            <td class="brutal-td">HARD</td>
            <td class="brutal-td brutal-status-locked">LOCKED</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDesignVariant } from '~/composables/useDesignVariant'
const { cssVariables } = useDesignVariant()
</script>

<style scoped>
.brutal-hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  max-width: 800px;
}

/* Title */
.brutal-title {
  font-size: clamp(3.5rem, 10vw, 6rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.01em;
  color: var(--variant-fg);
  margin: 0;
  text-transform: uppercase;
}

/* Tagline */
.brutal-tagline {
  display: flex;
  align-items: center;
  gap: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--variant-fg);
  margin: 0;
}

.brutal-prompt-char {
  color: var(--variant-accent);
  font-weight: 700;
}

.brutal-cursor {
  font-weight: 700;
  color: var(--variant-fg);
  margin-left: 1px;
}

/* Stats box */
.brutal-stats-box {
  width: 100%;
  max-width: 420px;
  border: 2px solid var(--variant-border);
  background-color: var(--variant-bg-secondary);
}

.brutal-stats-header {
  padding: 0.25rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--variant-fg-muted);
  border-bottom: 2px solid var(--variant-border);
  background-color: var(--variant-muted);
}

.brutal-stats-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.brutal-stat-row {
  display: flex;
  align-items: baseline;
  border-bottom: 1px solid var(--variant-border);
  padding: 0.35rem 0.75rem;
  gap: 0;
}

.brutal-stat-row:last-child {
  border-bottom: none;
}

.brutal-stat-key {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--variant-fg-muted);
  width: 140px;
  flex-shrink: 0;
}

.brutal-stat-key::after {
  content: ':';
}

.brutal-stat-val {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--variant-fg);
  margin: 0;
}

.brutal-stat-active {
  color: var(--variant-correct);
}

/* CTA button */
.brutal-cta-btn {
  font-family: inherit;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: var(--variant-bg);
  background-color: var(--variant-fg);
  border: 2px solid var(--variant-fg);
  border-radius: 0;
  padding: 0.6rem 1.75rem;
  cursor: pointer;
  box-shadow: 4px 4px 0px var(--variant-fg);
  transition: box-shadow 0.05s ease, transform 0.05s ease;
}

.brutal-cta-btn:hover {
  box-shadow: 2px 2px 0px var(--variant-fg);
  transform: translate(2px, 2px);
}

.brutal-cta-btn:active {
  box-shadow: none;
  transform: translate(4px, 4px);
}

/* Modes section */
.brutal-modes-section {
  width: 100%;
}

.brutal-modes-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--variant-fg-muted);
  margin-bottom: 0.5rem;
}

.brutal-modes-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid var(--variant-border);
  font-size: 0.8rem;
}

.brutal-th {
  text-align: left;
  padding: 0.35rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--variant-fg-muted);
  background-color: var(--variant-muted);
  border-bottom: 2px solid var(--variant-border);
  border-right: 1px solid var(--variant-border);
}

.brutal-th:last-child {
  border-right: none;
}

.brutal-tr {
  border-bottom: 1px solid var(--variant-border);
}

.brutal-tr:last-child {
  border-bottom: none;
}

.brutal-tr-active {
  background-color: var(--variant-muted);
}

.brutal-td {
  padding: 0.35rem 0.75rem;
  font-weight: 600;
  color: var(--variant-fg);
  border-right: 1px solid var(--variant-border);
}

.brutal-td:last-child {
  border-right: none;
}

.brutal-status-open {
  color: var(--variant-correct);
  font-weight: 700;
}

.brutal-status-locked {
  color: var(--variant-fg-muted);
  font-weight: 700;
}
</style>
