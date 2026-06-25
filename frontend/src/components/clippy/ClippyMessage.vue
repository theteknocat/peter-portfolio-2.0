<script setup lang="ts">
// Clippy's in-bubble action buttons. clippyjs has no native button support, so
// we teleport our own button row INTO the balloon element (passed as `to`); it
// then renders inside the speech bubble and tracks it when the widget is dragged.
//
// Nav buttons are real <RouterLink>s. Gag buttons do nothing on their own — they
// emit `gag` and let the companion play an animation + canned line.
import { RouterLink } from 'vue-router'
import type { ClippyAction } from '@/composables/clippyActions'

defineProps<{
  /** The balloon element to teleport the buttons into. */
  to: HTMLElement
  /** Buttons for the current scope. */
  actions: ClippyAction[]
}>()

// Typed emits: `gag` carries the gag key. `nav` and `close` are argless — they
// tell the companion to close the held bubble (nav on a nav-button click, the
// RouterLink still navigating; close on the always-present Cancel button).
const emit = defineEmits<{
  gag: [key: string]
  nav: []
  close: []
}>()
</script>

<template>
  <Teleport :to="to">
    <menu class="clippy-actions">
      <li v-for="action in actions" class="clippy-action" :key="action.label">
        <RouterLink v-if="action.kind === 'nav'" :to="action.to" class="clippy-btn" @click="emit('nav')">
          <span class="clippy-btn-text">{{ action.label }}</span>
        </RouterLink>
        <button v-else type="button" class="clippy-btn" @click="emit('gag', action.gag)">
          <span class="clippy-btn-text">{{ action.label }}</span>
        </button>
      </li>
      <!-- Always-present escape hatch: just dismiss the bubble, no navigation. -->
      <li class="clippy-action">
        <button type="button" class="clippy-btn" @click="emit('close')">
          <span class="clippy-btn-text">Close</span>
        </button>
      </li>
    </menu>
  </Teleport>
</template>

<style scoped>
/* Classic Office Assistant balloon buttons: flat, thin-bordered dialog boxes
   sitting on the balloon's #ffc yellow, under a separator rule. Negative
   side-margins bleed the rule out to the bubble's inner edges (balloon has 8px
   padding). Wraps because our labels are longer than the 200px bubble. */
.clippy-actions {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 0.3rem;
  margin: 0.5rem 0 0;
  padding: 0.5rem 0 0;
  border-top: 1px solid #898989;
  list-style: none;
  font-size: 0.7rem;
}

.clippy-actions .clippy-action {
  margin: 0;
  padding: 0;
}

.clippy-btn {
  display: block;
  padding: 4px 6px;
  font: inherit;
  color: #000;
  text-align: center;
  background: none;
  border: 1px solid #b2b2b2;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  & .clippy-btn-text {
    display: inline-block;
    padding: 0 4px;
    white-space: nowrap;
    border: 1px solid transparent;
    transition: border 0.3s ease;
  }
}

.clippy-btn:hover,
.clippy-btn:focus-visible {
  background: rgba(0, 0, 0, 0.08);
  outline: none;
  & .clippy-btn-text {
    border: 1px dotted #000;
  }
}

.clippy-btn:active {
  background: rgba(0, 0, 0, 0.16);
}
</style>
