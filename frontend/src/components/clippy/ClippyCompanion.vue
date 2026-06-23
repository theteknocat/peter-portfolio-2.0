<script setup lang="ts">
// Clippy companion — first stand-up. Loads the agent, shows it, says one line.
// Not wired to routes, the API, or session state yet; this is just to see it on
// the page. clippyjs injects its own DOM into <body> and positions itself.
import { onMounted, onUnmounted, shallowRef } from 'vue'
// Type-only import is erased at build, so it costs nothing at runtime / SSR.
import type { initAgent } from 'clippyjs'

type Agent = Awaited<ReturnType<typeof initAgent>>

const agent = shallowRef<Agent | null>(null)

onMounted(async () => {
  // Dynamic import keeps the browser-only library out of the SSG prerender
  // and out of the main bundle.
  const { initAgent } = await import('clippyjs')
  const { Clippy } = await import('clippyjs/agents')

  const a = await initAgent(Clippy)
  agent.value = a
  a.show()
  a.speak("It looks like you're visiting Peter's portfolio. Need a hand?")
})

onUnmounted(() => agent.value?.dispose())
</script>

<template>
  <!-- clippyjs renders into <body> directly; nothing to mount here. -->
</template>
