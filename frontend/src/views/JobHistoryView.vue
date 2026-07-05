<script setup lang="ts">
/**
 * Job history page — fetches the job-history page layout and renders
 * each job entry inline (no modal).
 */
import { usePageData } from '@/composables/usePageData'
import { useSeo } from '@/composables/useSeo'
import { useSectionComponents } from '@/composables/useSectionComponents'
import PageTitle from '@/components/ui/PageTitle.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
import TextSection from '@/components/sections/TextSection.vue'
import JobListSection from '@/components/jobs/JobListSection.vue'

const { data, loading, error } = usePageData('job-history')

useSeo({
  title: 'Job History — Peter Epp',
  description: 'Professional work history of Peter Epp.',
  path: '/job-history',
})

const { resolveSection } = useSectionComponents({
  text: TextSection,
  'job-list': JobListSection,
})
</script>

<template>
  <div class="view-container">
    <PageTitle>Job History</PageTitle>
    <ContentCard>
      <p v-if="loading">Loading…</p>
      <p v-else-if="error">Error: {{ error }}</p>
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
