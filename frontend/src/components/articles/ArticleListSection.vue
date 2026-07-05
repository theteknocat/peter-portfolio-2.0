<script setup lang="ts">
/**
 * Article list section — renders the manifest-driven grid of articles for a
 * resolved 'article-list' section, sorted newest-first by date.
 */
import { computed } from 'vue'
import type { ResolvedSection } from '@/types/page'
import type { Article } from '@/types/article'
import ArticleCard from '@/components/articles/ArticleCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = computed(() =>
  [...((props.section.items ?? []) as unknown as Article[])].sort(
    (a, b) => (b.date ?? '').localeCompare(a.date ?? '')
  )
)
const title = computed(() => props.section.content?.title as string | undefined)
</script>

<template>
  <div>
    <h2 v-if="title">{{ title }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ArticleCard v-for="item in items" :key="item.slug" :item="item" />
    </div>
  </div>
</template>
