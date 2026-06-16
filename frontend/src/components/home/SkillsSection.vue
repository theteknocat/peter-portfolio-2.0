<script setup lang="ts">
/**
 * Skills section — a flat list of skill/technology names from the skills content file.
 * Expects section.content from 'pages/skills.yaml'.
 */
import type { ResolvedSection } from '@/types/page'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContentCard from '@/components/ui/ContentCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const content = props.section.content as {
  title?: string
  skills?: string[]
} | null | undefined
</script>

<template>
  <section class="home-skills">
    <SectionHeading>{{ content?.title ?? 'Skills' }}</SectionHeading>
    <ContentCard v-if="content?.skills?.length">
      <ul class="skills-list">
        <li v-for="skill in content.skills" :key="skill">{{ skill }}</li>
      </ul>
    </ContentCard>
    <ContentCard v-else>
      <p>Skills content not yet loaded.</p>
    </ContentCard>
  </section>
</template>
