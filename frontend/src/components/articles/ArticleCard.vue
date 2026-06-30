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
  <RouterLink :to="`/articles/${item.slug}`" class="card-link flex flex-col shape-chamfer shape-jitter">
    <div class="card-header">
      <h2 class="card-title m-0">{{ item.title }}</h2>
    </div>
    <p class="card-summary flex-1">{{ item.summary || '&nbsp;' }}</p>
    <p v-if="item.date" class="card-date">{{ formatDate(item.date) }}</p>
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

.card-date {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-primary-light);
  text-align: right;
}
</style>
