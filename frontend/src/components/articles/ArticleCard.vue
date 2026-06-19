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
  <RouterLink :to="`/articles/${item.slug}`" class="card-link shape-chamfer shape-jitter">
    <div class="card-header">
      <h2 class="card-title">{{ item.title }}</h2>
      <p v-if="item.date" class="card-date">{{ formatDate(item.date) }}</p>
    </div>
    <p v-if="item.summary" class="card-summary">{{ item.summary }}</p>
  </RouterLink>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 0.5rem;
}

.card-header .card-title {
  margin: 0;
}

.card-date {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-primary-light);
  margin-left: auto;
}
</style>
