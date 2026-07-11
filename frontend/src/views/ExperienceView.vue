<script setup lang="ts">
/**
 * Experience page — fetches the experience page layout and renders the
 * experience timeline inline (no modal).
 */
import { usePageData } from '@/composables/usePageData'
import { useSeo } from '@/composables/useSeo'
import { useSectionComponents } from '@/composables/useSectionComponents'
import PageTitle from '@/components/ui/PageTitle.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
import TextSection from '@/components/sections/TextSection.vue'
import ExperienceTimelineSection from '@/components/experience/ExperienceTimelineSection.vue'

const { data, error } = await usePageData('experience')

useSeo({
  title: 'Experience — Peter Epp',
  description: 'Professional experience of Peter Epp.',
  path: '/experience',
})

const { resolveSection } = useSectionComponents({
  text: TextSection,
  'experience-timeline': ExperienceTimelineSection,
})
</script>

<template>
  <div class="view-container">
    <PageTitle>Experience</PageTitle>
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
