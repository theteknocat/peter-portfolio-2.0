<script setup lang="ts">
/**
 * Featured articles section — up to 3 featured articles.
 * Items are resolved server-side from the articles manifest (filter: featured, limit: 3).
 */
import type { ResolvedSection } from '@/types/page'
import type { Article } from '@/types/article'
import { Newspaper, ChevronRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import ContentCard from '@/components/ui/ContentCard.vue'
import ArticleCard from '@/components/articles/ArticleCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

// Sorted newest-first by date — overrides manifest order for display.
const items = [...((props.section.items ?? []) as unknown as Article[])].sort(
  (a, b) => (b.date ?? '').localeCompare(a.date ?? '')
)
</script>

<template>
  <section class="home-featured-articles">
    <ContentCard>
      <h2 class="flex flex-wrap items-center justify-start gap-x-2 gap-y-0 mb-4">
        <Newspaper :size="24" />
        {{ (props.section.content?.title as string | undefined) ?? 'Recent Writing' }}
        <div class="flex w-full sm:w-auto md:w-full lg:w-auto items-center sm:ml-auto md:ml-0 lg:ml-auto">
          <RouterLink to="/articles" class="btn shape-chamfer shape-jitter">
            <span class="text-sm">See all</span>
            <ChevronRight :size="16" />
          </RouterLink>
        </div>
      </h2>
      <p v-if="items.length === 0">Articles will appear here once content is loaded.</p>
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ArticleCard v-for="item in items" :key="item.slug" :item="item" />
      </div>
    </ContentCard>
  </section>
</template>
