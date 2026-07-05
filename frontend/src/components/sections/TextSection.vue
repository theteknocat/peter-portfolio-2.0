<script setup lang="ts">
/**
 * Generic text section — an optional title plus a Markdown body. Reusable on
 * any page that needs a plain intro/blurb ahead of its main content. The body
 * comes from the section source's sibling .md file (section.content.body).
 */
import { computed } from 'vue'
import type { ResolvedSection } from '@/types/page'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue'

const props = defineProps<{ section: ResolvedSection }>()

const content = computed(() => props.section.content as {
  title?: string
  body?: string
} | null | undefined)
</script>

<template>
  <div v-if="content?.title || content?.body" class="text-section">
    <h2 v-if="content?.title">{{ content.title }}</h2>
    <MarkdownRenderer v-if="content?.body" :content="content.body" />
  </div>
</template>

<style scoped>
.text-section {
  margin-bottom: 1.5rem;
}
</style>
