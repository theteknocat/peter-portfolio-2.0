<script setup lang="ts">
/**
 * Renders a Markdown string as HTML using `marked` with highlight.js for
 * syntax-highlighted code blocks. Output is injected via v-html — safe here
 * because all content comes from our own flat-file content directory, not user input.
 */
import { computed } from 'vue'
import { marked, Renderer } from 'marked'
import hljs from 'highlight.js'

// Custom code renderer — configured once at module level.
// markedHighlight is incompatible with marked v15; a custom Renderer is the
// supported alternative. The renderer return value is used as raw HTML so
// highlight.js output is not re-escaped by marked.
const renderer = new Renderer()
renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
}
marked.use({ renderer })

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
