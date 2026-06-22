<script setup lang="ts">
/**
 * Intro terminal — the home page's introductory text, styled as a terminal.
 * Typewriter reveal (first site load only) comes later; for now it renders the
 * subtitle + body from the 'pages/home-intro.yaml' content file.
 * Title and section nav live in HomeView, not here.
 */
import { computed } from 'vue'
import type { ResolvedSection } from '@/types/page'

const props = defineProps<{ section: ResolvedSection }>()

const content = computed(() => props.section.content as {
  subtitle?: string
  body?: string
} | null | undefined)
</script>

<template>
  <section class="intro-terminal">
    <template v-if="content">
      <p v-if="content.subtitle" class="intro-subtitle">{{ content.subtitle }}</p>
      <p v-if="content.body">{{ content.body }}</p>
    </template>
    <p v-else>Hero content not yet loaded.</p>
  </section>
</template>

<style scoped>
/* Desktop: fill the sticky panel's remaining height, scroll internally before
   the nav above is pushed off. Mobile: natural height flow (unchanged). */
@media (min-width: 768px) {
  .intro-terminal {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
