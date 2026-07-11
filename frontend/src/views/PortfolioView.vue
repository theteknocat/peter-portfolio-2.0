<script setup lang="ts">
/**
 * Portfolio list page — fetches the portfolio page layout and renders
 * each item as a clickable card linking to the modal detail route.
 */
import { usePageData } from '@/composables/usePageData'
import { useSeo } from '@/composables/useSeo'
import { useSectionComponents } from '@/composables/useSectionComponents'
import PageTitle from '@/components/ui/PageTitle.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
import TextSection from '@/components/sections/TextSection.vue'
import PortfolioListSection from '@/components/portfolio/PortfolioListSection.vue'

const { data, error } = await usePageData('portfolio')

useSeo({
  title: 'Portfolio — Peter Epp',
  description: 'Selected web development projects by Peter Epp.',
  path: '/portfolio',
})

const { resolveSection } = useSectionComponents({
  text: TextSection,
  'portfolio-list': PortfolioListSection,
})
</script>

<template>
  <div class="view-container">
    <PageTitle>Portfolio</PageTitle>
    <ContentCard>
      <p v-if="error">Error: {{ error }}</p>
      <template v-else>
        <component
          v-for="section in data?.sections ?? []"
          :key="(section.content?.slug as string | undefined) ?? section.template"
          :is="resolveSection(section.template)"
          :section="section"
        />
      </template>
    </ContentCard>
  </div>
</template>
