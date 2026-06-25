<script setup lang="ts">
/**
 * Renders a Markdown string as HTML using `marked` with highlight.js for
 * syntax-highlighted code blocks. Output is injected via v-html — safe here
 * because all content comes from our own flat-file content directory, not user input.
 */
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { marked, Renderer } from 'marked'
import hljs from 'highlight.js'
import { attachTooltip, resolveTooltipText } from '@/directives/tooltip'

// Custom renderer — configured once at module level.
// markedHighlight is incompatible with marked v15; a custom Renderer is the
// supported alternative. The renderer return value is used as raw HTML so
// highlight.js output is not re-escaped by marked.
const renderer = new Renderer()
renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
}
// Escape a value for safe interpolation into a double-quoted HTML attribute.
// marked v15 no longer sanitizes, and overriding renderer.link bypasses its own
// escaping — so a stray " in an href/title can't break out of the attribute.
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

// External links (absolute http[s]) open in a new tab; the icon + tooltip are
// added in CSS / via attachTooltip below. Internal links stay plain <a> and are
// routed through vue-router by the click handler.
renderer.link = function (this: Renderer, { href, title, tokens }) {
  // `this.parser` (not the closured `renderer`): marked clones the renderer, so
  // only `this` carries the live parser instance.
  const text = this.parser.parseInline(tokens) as string
  const external = /^https?:\/\//i.test(href)
  const attrs = [
    `href="${escapeAttr(href)}"`,
    title ? `title="${escapeAttr(title)}"` : null,
    external ? 'target="_blank" rel="noopener noreferrer"' : null,
  ]
    .filter(Boolean)
    .join(' ')
  return `<a ${attrs}>${text}</a>`
}
marked.use({ renderer })

const props = defineProps<{
  content: string
}>()

// marked.parse() returns string | Promise<string>. The default (synchronous)
// renderer returns a plain string — we cast to keep TypeScript happy.
const html = computed(() => marked.parse(props.content) as string)

const router = useRouter()
const bodyRef = ref<HTMLElement>()
let detachers: Array<() => void> = []

// The v-tooltip directive can't bind to v-html-injected anchors, so attach the
// same styled tooltip imperatively to each external link after every render.
function syncTooltips() {
  detachers.forEach((d) => d())
  detachers = []
  const anchors = bodyRef.value?.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')
  anchors?.forEach((a) => detachers.push(attachTooltip(a, resolveTooltipText(a))))
}

watch(
  html,
  async () => {
    await nextTick()
    syncTooltips()
  },
  { immediate: true },
)

onUnmounted(() => detachers.forEach((d) => d()))

// Internal links render to plain <a>, which would trigger a full page reload.
// Route them through vue-router; let external/new-tab/hash/modified clicks pass.
function onMarkdownClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest('a')
  const href = a?.getAttribute('href')
  if (!a || !href) return
  if (
    a.target === '_blank' ||
    /^https?:\/\//i.test(href) ||
    href.startsWith('#') ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  ) {
    return
  }
  e.preventDefault()
  router.push(href)
}
</script>

<template>
  <div ref="bodyRef" class="markdown-body" v-html="html" @click="onMarkdownClick" />
</template>
