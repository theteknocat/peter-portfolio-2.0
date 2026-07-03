<script setup lang="ts">
/**
 * Featured portfolio section — up to 3 featured portfolio items.
 * Items are resolved server-side from the portfolio manifest (filter: featured, limit: 3).
 */
import type { ResolvedSection } from '@/types/page'
import type { PortfolioItem } from '@/types/portfolio'
import { Briefcase, ChevronRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import ContentCard from '@/components/ui/ContentCard.vue'
import PortfolioCard from '@/components/portfolio/PortfolioCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = (props.section.items ?? []) as unknown as PortfolioItem[]
</script>

<template>
  <section class="home-featured-portfolio">
    <ContentCard>
      <h2 class="flex flex-wrap items-center justify-start gap-x-2 gap-y-0 mb-4">
        <Briefcase :size="24" />
        {{ (props.section.content?.title as string | undefined) ?? 'Featured Work' }}
        <div class="flex w-full sm:w-auto md:w-full lg:w-auto items-center sm:ml-auto md:ml-0 lg:ml-auto">
          <RouterLink to="/portfolio" class="btn shape-chamfer shape-jitter">
            <span class="text-sm">See all</span>
            <ChevronRight :size="16" />
          </RouterLink>
        </div>
      </h2>
      <p v-if="items.length === 0">Portfolio items will appear here once content is loaded.</p>
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <PortfolioCard v-for="item in items" :key="item.slug" :item="item" />
      </div>
    </ContentCard>
  </section>
</template>
