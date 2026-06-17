<script setup lang="ts">
/**
 * Featured articles section — up to 3 featured articles.
 * Items are resolved server-side from the articles manifest (filter: featured, limit: 3).
 */
import type { ResolvedSection } from '@/types/page'
import type { Article } from '@/types/article'
import ContentCard from '@/components/ui/ContentCard.vue'
import ArticleCard from '@/components/articles/ArticleCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = (props.section.items ?? []) as unknown as Article[]
</script>

<template>
  <section class="home-featured-articles">
    <ContentCard>
      <h2 class="text-center">Recent Writing</h2>
      <p v-if="items.length === 0">Articles will appear here once content is loaded.</p>
      <div v-else class="card-stack">
        <ArticleCard v-for="item in items" :key="item.slug" :item="item" />
      </div>
    </ContentCard>
  </section>
</template>
