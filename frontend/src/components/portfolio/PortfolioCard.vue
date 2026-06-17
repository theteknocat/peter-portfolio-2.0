<script setup lang="ts">
/**
 * Clickable card for a portfolio item in the portfolio list.
 * Links to the modal route `/portfolio/:slug`.
 */
import { RouterLink } from 'vue-router'
import type { PortfolioItem } from '@/types/portfolio'

defineProps<{
  item: PortfolioItem
}>()
</script>

<template>
  <RouterLink :to="`/portfolio/${item.slug}`" class="portfolio-card">
    <h2 class="card-title">{{ item.title }}</h2>
    <p v-if="item.summary" class="card-summary">{{ item.summary }}</p>
    <ul v-if="item.tags?.length" class="card-tags">
      <li v-for="tag in item.tags" :key="tag">{{ tag }}</li>
    </ul>
  </RouterLink>
</template>

<style scoped>
.portfolio-card {
  display: block;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-border);
  color: inherit;
  text-decoration: none;
  transition: border-color 0.2s ease;
}

.portfolio-card:hover {
  border-color: var(--color-accent);
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
  margin: 0 0 0.75rem;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.card-tags li {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-primary-light);
  border: 1px solid var(--color-primary-dark);
  padding: 0.125rem 0.5rem;
}
</style>
