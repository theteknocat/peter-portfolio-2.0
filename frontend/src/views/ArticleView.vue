<script setup lang="ts">
/**
 * Article detail — rendered in the modal outlet.
 * Fetches the full article (including markdown body) by slug from the API.
 */
import { useRoute } from 'vue-router'
import { useContent } from '@/composables/useContent'
import type { Article } from '@/types/article'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue'
import { formatDate } from '@/utils/date'

const route = useRoute()
const slug = route.params.slug as string

const { data, loading, error } = useContent<Article>('articles', slug)
</script>

<template>
  <div class="modal-content">
    <p v-if="loading">Loading…</p>
    <p v-else-if="error">Error: {{ error }}</p>
    <template v-else-if="data">
      <p v-if="data.date" class="modal-date">{{ formatDate(data.date) }}</p>
      <h2 class="modal-title">{{ data.title }}</h2>
      <p v-if="data.summary" class="modal-summary">{{ data.summary }}</p>
      <MarkdownRenderer v-if="data.body" :content="data.body" />
    </template>
  </div>
</template>

<style scoped>
.modal-content {
  color: var(--color-text);
}

.modal-date {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-primary-light);
  margin: 0 0 0.25rem;
}

.modal-title {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.75rem;
  color: var(--color-accent-light);
  margin: 0 0 0.75rem;
}

.modal-summary {
  font-size: 1rem;
  color: var(--color-text-light);
  margin: 0 0 1.5rem;
  font-style: italic;
}
</style>
