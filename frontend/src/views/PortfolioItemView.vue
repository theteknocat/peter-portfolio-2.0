<script setup lang="ts">
/**
 * Portfolio item detail — rendered in the modal outlet.
 * Fetches the full item (including markdown body) by slug from the API.
 */
import { watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useContent } from '@/composables/useContent'
import type { PortfolioItem } from '@/types/portfolio'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue'
import TechBadge from '@/components/ui/TechBadge.vue'

const route = useRoute()
const slug = route.params.slug as string

const { data, loading, error } = useContent<PortfolioItem>('portfolio', slug)

const signalModalReady = inject<() => void>('signalModalReady', () => {})
watch(loading, (isLoading) => { if (!isLoading) signalModalReady() })
</script>

<template>
  <div class="modal-content">
    <p v-if="loading">Loading…</p>
    <p v-else-if="error">Error: {{ error }}</p>
    <template v-else-if="data">
      <h2 class="modal-title">{{ data.title }}</h2>
      <ul v-if="data.tags?.length" class="tag-list modal-tags">
        <TechBadge v-for="tag in data.tags" :key="tag.label" :tag="tag" />
      </ul>
      <p v-if="data.summary" class="modal-summary">{{ data.summary }}</p>
      <MarkdownRenderer v-if="data.body" :content="data.body" />
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.modal-content {
  color: var(--color-text);
}

.modal-title {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: calc(1.37rem + 1.47vw);
  color: var(--color-accent-light);
  margin: 0 0 0.75rem;
}

@media (width >= theme(--breakpoint-xl)) {
  .modal-title { font-size: 2.5rem; }
}

.modal-tags {
  margin-bottom: 1rem;
}

.modal-summary {
  font-size: 1rem;
  color: var(--color-text-light);
  margin: 0 0 1.5rem;
  font-style: italic;
}
</style>
