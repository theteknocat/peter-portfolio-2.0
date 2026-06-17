<script setup lang="ts">
/**
 * Featured articles section — up to 3 featured articles.
 * Items are resolved server-side from the articles manifest (filter: featured, limit: 3).
 */
import { RouterLink } from 'vue-router'
import type { ResolvedSection } from '@/types/page'
import type { Article } from '@/types/article'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
import { formatDate } from '@/utils/date'

const props = defineProps<{ section: ResolvedSection }>()

const items = (props.section.items ?? []) as unknown as Article[]
</script>

<template>
  <section class="home-featured-articles">
    <SectionHeading>Recent Writing</SectionHeading>
    <ContentCard v-if="items.length === 0">
      <p>Articles will appear here once content is loaded.</p>
    </ContentCard>
    <div v-else class="featured-grid">
      <RouterLink
        v-for="item in items"
        :key="item.slug"
        :to="`/articles/${item.slug}`"
        class="featured-item"
      >
        <ContentCard>
          <p v-if="item.date" class="article-date">{{ formatDate(item.date) }}</p>
          <h2>{{ item.title }}</h2>
          <p v-if="item.summary">{{ item.summary }}</p>
        </ContentCard>
      </RouterLink>
    </div>
  </section>
</template>
