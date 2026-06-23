<script setup lang="ts">
/**
 * Articles list page — fetches the articles page layout and renders
 * each item as a clickable card linking to the modal detail route.
 */
import { computed } from 'vue'
import { usePageData } from '@/composables/usePageData'
import { useSeo } from '@/composables/useSeo'
import type { Article } from '@/types/article'
import PageTitle from '@/components/ui/PageTitle.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
import ArticleCard from '@/components/articles/ArticleCard.vue'

const { data, loading, error } = usePageData('articles')

useSeo({
  title: 'Articles — Peter Epp',
  description: 'Writing on web development by Peter Epp.',
  path: '/articles',
})

const items = computed(
  () => (data.value?.sections[0]?.items ?? []) as unknown as Article[]
)
</script>

<template>
  <div class="view-container">
    <PageTitle>Articles</PageTitle>
    <ContentCard>
      <p v-if="loading">Loading…</p>
      <p v-else-if="error">Error: {{ error }}</p>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArticleCard v-for="item in items" :key="item.slug" :item="item" />
      </div>
    </ContentCard>
  </div>
</template>
