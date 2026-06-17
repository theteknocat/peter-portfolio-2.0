<script setup lang="ts">
/**
 * Skills section — a flat list of skill/technology names from the skills content file.
 * Expects section.content from 'pages/skills.yaml'.
 */
import type { ResolvedSection } from '@/types/page'
import ContentCard from '@/components/ui/ContentCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const content = props.section.content as {
  title?: string
  skills?: string[]
} | null | undefined
</script>

<template>
  <section class="home-skills">
    <ContentCard>
      <h2 class="text-center">{{ content?.title ?? 'Skills' }}</h2>
      <ul v-if="content?.skills?.length" class="skills-list">
        <li v-for="skill in content.skills" :key="skill">{{ skill }}</li>
      </ul>
      <p v-else>Skills content not yet loaded.</p>
    </ContentCard>
  </section>
</template>
