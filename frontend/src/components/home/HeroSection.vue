<script setup lang="ts">
/**
 * Hero section — page title, subtitle, and introductory body text.
 * Expects section.content from the 'pages/home-hero.yaml' content file.
 */
import type { ResolvedSection } from '@/types/page'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContentCard from '@/components/ui/ContentCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const content = props.section.content as {
  title?: string
  subtitle?: string
  body?: string
} | null | undefined
</script>

<template>
  <section class="home-hero">
    <SectionHeading>{{ content?.title ?? 'Peter Epp' }}</SectionHeading>
    <ContentCard v-if="content">
      <p v-if="content.subtitle" class="hero-subtitle">{{ content.subtitle }}</p>
      <p v-if="content.body">{{ content.body }}</p>
    </ContentCard>
    <ContentCard v-else>
      <p>Hero content not yet loaded.</p>
    </ContentCard>
  </section>
</template>
