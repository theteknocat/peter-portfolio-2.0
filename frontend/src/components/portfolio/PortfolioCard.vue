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
  <RouterLink :to="`/portfolio/${item.slug}`" class="card-link">
    <h2 class="card-title">{{ item.title }}</h2>
    <p v-if="item.summary" class="card-summary">{{ item.summary }}</p>
    <ul v-if="item.tags?.length" class="tag-list">
      <li v-for="tag in item.tags" :key="tag">{{ tag }}</li>
    </ul>
  </RouterLink>
</template>

<style scoped>
/* Tags need bottom spacing to separate from any content below */
.card-summary {
  margin-bottom: 0.75rem;
}
</style>
