<script setup lang="ts">
/**
 * Article detail — rendered in the modal outlet.
 * Fetches the full article (including markdown body) by slug from the API.
 */
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { useContent } from '@/composables/useContent'
import type { Article } from '@/types/article'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue'
import { formatDate } from '@/utils/date'

const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await useContent<Article>('articles', slug)

inject<() => void>('signalModalReady', () => {})()
</script>

<template>
  <div class="modal-content">
    <p v-if="error">Error: {{ error }}</p>
    <template v-else-if="data">
      <div class="modal-header">
        <h2 class="modal-title m-0">{{ data.title }}</h2>
        <p v-if="data.date" class="modal-date">{{ formatDate(data.date) }}</p>
      </div>
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

.modal-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-bottom: 0.75rem;
}

.modal-date {
  font-size: 0.9rem;
  font-family: var(--font-mono);
  color: var(--color-primary-light);
  margin-left: auto;
}

.modal-title {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: calc(1.37rem + 1.47vw);
  color: var(--color-accent-light);
}

@media (width >= theme(--breakpoint-xl)) {
  .modal-title { font-size: 2.5rem; }
}

.modal-summary {
  font-size: 1rem;
  color: var(--color-text-light);
  margin: 0 0 1.5rem;
  font-style: italic;
}
</style>
