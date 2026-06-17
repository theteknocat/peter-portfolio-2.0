<script setup lang="ts">
/**
 * Clickable card for an article in the articles list.
 * Links to the modal route `/articles/:slug`.
 */
import { RouterLink } from 'vue-router'
import type { Article } from '@/types/article'
import { formatDate } from '@/utils/date'

defineProps<{
  item: Article
}>()
</script>

<template>
  <RouterLink :to="`/articles/${item.slug}`" class="article-card">
    <p v-if="item.date" class="card-date">{{ formatDate(item.date) }}</p>
    <h2 class="card-title">{{ item.title }}</h2>
    <p v-if="item.summary" class="card-summary">{{ item.summary }}</p>
  </RouterLink>
</template>

<style scoped>
.article-card {
  display: block;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-border);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease;
}

.article-card:hover {
  border-color: var(--color-accent);
}

.card-date {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-primary-light);
  margin: 0 0 0.25rem;
}

.card-title {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.25rem;
  color: var(--color-accent-light);
  margin: 0 0 0.5rem;
}

.card-summary {
  font-size: 0.9rem;
  color: var(--color-text);
  margin: 0;
}
</style>
