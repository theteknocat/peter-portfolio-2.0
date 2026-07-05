<script setup lang="ts">
/**
 * Portfolio list section — renders the manifest-driven grid of portfolio
 * items for a resolved 'portfolio-list' section.
 */
import { computed } from 'vue'
import type { ResolvedSection } from '@/types/page'
import type { PortfolioItem } from '@/types/portfolio'
import PortfolioCard from '@/components/portfolio/PortfolioCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = computed(() => (props.section.items ?? []) as unknown as PortfolioItem[])
const title = computed(() => props.section.content?.title as string | undefined)
</script>

<template>
  <div>
    <h2 v-if="title">{{ title }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <PortfolioCard v-for="item in items" :key="item.slug" :item="item" />
    </div>
  </div>
</template>
