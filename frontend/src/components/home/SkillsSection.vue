<script setup lang="ts">
/**
 * Skills section — interactive hex grid of skill icons from the skills content file.
 * Expects section.content from 'pages/skills.yaml'.
 */
import { computed } from 'vue'
import type { ResolvedSection } from '@/types/page'
import type { Tag } from '@/types/portfolio'
import ContentCard from '@/components/ui/ContentCard.vue'
import HexSkillsGrid from '@/components/home/HexSkillsGrid.vue'

const props = defineProps<{ section: ResolvedSection }>()

const content = computed(() => props.section.content as {
  title?: string
  skills?: Tag[]
} | null | undefined)
</script>

<template>
  <section class="home-skills">
    <ContentCard>
      <h2 class="text-center">{{ content?.title ?? 'Skills' }}</h2>
      <HexSkillsGrid v-if="content?.skills?.length" :skills="content.skills" />
      <p v-else>Skills content not yet loaded.</p>
    </ContentCard>
  </section>
</template>
