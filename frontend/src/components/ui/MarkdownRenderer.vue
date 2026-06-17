<script setup lang="ts">
/**
 * Renders a Markdown string as HTML using `marked`.
 * Output is injected via v-html — safe here because all content comes from
 * our own flat-file YAML/Markdown content directory, not user input.
 */
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content: string
}>()

// marked.parse() returns string | Promise<string>. The default (synchronous)
// renderer returns a plain string — we cast to keep TypeScript happy.
const html = computed(() => marked.parse(props.content) as string)
</script>

<template>
  <div class="markdown-body" v-html="html" />
</template>
