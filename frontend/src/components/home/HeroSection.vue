<script setup lang="ts">
/**
 * Hero section — page title, subtitle, and introductory body text.
 * Expects section.content from the 'pages/home-hero.yaml' content file.
 */
import type { ResolvedSection } from '@/types/page'
import PageTitle from '@/components/ui/PageTitle.vue'
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
    <ContentCard>
      <PageTitle>{{ content?.title ?? 'Peter Epp' }}</PageTitle>
      <template v-if="content">
        <p v-if="content.subtitle" class="hero-subtitle">{{ content.subtitle }}</p>
        <p v-if="content.body">{{ content.body }}</p>
      </template>
      <template v-else>
        <p>Hero content not yet loaded.</p>
      </template>
    </ContentCard>
  </section>
</template>
