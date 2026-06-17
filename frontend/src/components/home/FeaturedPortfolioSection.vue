<script setup lang="ts">
/**
 * Featured portfolio section — up to 3 featured portfolio items.
 * Items are resolved server-side from the portfolio manifest (filter: featured, limit: 3).
 */
import type { ResolvedSection } from '@/types/page'
import type { PortfolioItem } from '@/types/portfolio'
import ContentCard from '@/components/ui/ContentCard.vue'
import PortfolioCard from '@/components/portfolio/PortfolioCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = (props.section.items ?? []) as unknown as PortfolioItem[]
</script>

<template>
  <section class="home-featured-portfolio">
    <ContentCard>
      <h2 class="text-center">Featured Work</h2>
      <p v-if="items.length === 0">Portfolio items will appear here once content is loaded.</p>
      <div v-else class="item-list">
        <PortfolioCard v-for="item in items" :key="item.slug" :item="item" />
      </div>
    </ContentCard>
  </section>
</template>

<style scoped>
.item-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
