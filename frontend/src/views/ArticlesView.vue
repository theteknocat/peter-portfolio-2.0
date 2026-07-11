<script setup lang="ts">
/**
 * Articles list page — fetches the articles page layout and renders
 * each item as a clickable card linking to the modal detail route.
 */
import { usePageData } from '@/composables/usePageData'
import { useSeo } from '@/composables/useSeo'
import { useSectionComponents } from '@/composables/useSectionComponents'
import PageTitle from '@/components/ui/PageTitle.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
import TextSection from '@/components/sections/TextSection.vue'
import ArticleListSection from '@/components/articles/ArticleListSection.vue'

const { data, error } = await usePageData('articles')

useSeo({
  title: 'Articles — Peter Epp',
  description: 'Writing on web development by Peter Epp.',
  path: '/articles',
})

const { resolveSection } = useSectionComponents({
  text: TextSection,
  'article-list': ArticleListSection,
})
</script>

<template>
  <div class="view-container">
    <PageTitle>Articles</PageTitle>
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
