<script setup lang="ts">
/**
 * Portfolio list page — fetches the portfolio page layout and renders
 * each item as a clickable card linking to the modal detail route.
 */
import { computed } from 'vue'
import { usePageData } from '@/composables/usePageData'
import type { PortfolioItem } from '@/types/portfolio'
import PageTitle from '@/components/ui/PageTitle.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
import PortfolioCard from '@/components/portfolio/PortfolioCard.vue'

const { data, loading, error } = usePageData('portfolio')

// The portfolio page has a single 'portfolio-list' section.
// Pull items directly rather than using a dynamic component map.
const items = computed(
  () => (data.value?.sections[0]?.items ?? []) as unknown as PortfolioItem[]
)
</script>

<template>
  <div class="view-container">
    <PageTitle>Portfolio</PageTitle>
    <ContentCard>
      <p v-if="loading">Loading…</p>
      <p v-else-if="error">Error: {{ error }}</p>
      <div v-else class="portfolio-list">
        <PortfolioCard v-for="item in items" :key="item.slug" :item="item" />
      </div>
    </ContentCard>
  </div>
</template>

<style scoped>
.portfolio-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
