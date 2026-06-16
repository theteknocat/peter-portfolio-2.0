<script setup lang="ts">
/**
 * Featured articles section — up to 3 featured articles.
 * Items are resolved server-side from the articles manifest (filter: featured, limit: 3).
 */
import type { ResolvedSection } from '@/types/page'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContentCard from '@/components/ui/ContentCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = (props.section.items ?? []) as Array<{
  slug: string
  title?: string
  summary?: string
  date?: string
}>
</script>

<template>
  <section class="home-featured-articles">
    <SectionHeading>Recent Writing</SectionHeading>
    <ContentCard v-if="items.length === 0">
      <p>Articles will appear here once content is loaded.</p>
    </ContentCard>
    <div v-else class="featured-grid">
      <ContentCard v-for="item in items" :key="item.slug">
        <h2>{{ item.title ?? item.slug }}</h2>
        <p v-if="item.date" class="article-date">{{ item.date }}</p>
        <p v-if="item.summary">{{ item.summary }}</p>
      </ContentCard>
    </div>
  </section>
</template>
