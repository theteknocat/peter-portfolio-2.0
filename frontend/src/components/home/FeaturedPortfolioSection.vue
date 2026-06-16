<script setup lang="ts">
/**
 * Featured portfolio section — up to 3 featured portfolio items.
 * Items are resolved server-side from the portfolio manifest (filter: featured, limit: 3).
 */
import type { ResolvedSection } from '@/types/page'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContentCard from '@/components/ui/ContentCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = (props.section.items ?? []) as Array<{
  slug: string
  title?: string
  summary?: string
}>
</script>

<template>
  <section class="home-featured-portfolio">
    <SectionHeading>Featured Work</SectionHeading>
    <ContentCard v-if="items.length === 0">
      <p>Portfolio items will appear here once content is loaded.</p>
    </ContentCard>
    <div v-else class="featured-grid">
      <ContentCard v-for="item in items" :key="item.slug">
        <h2>{{ item.title ?? item.slug }}</h2>
        <p v-if="item.summary">{{ item.summary }}</p>
      </ContentCard>
    </div>
  </section>
</template>
