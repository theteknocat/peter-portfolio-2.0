<script lang="ts">
// True module scope: evaluated once on import, shared across all mounts. The
// typewriter runs once per full page load and never again on in-SPA navigation
// back to home (remounts read the same flag). A hard refresh resets it.
let hasAutoTyped = false
</script>

<script setup lang="ts">
/**
 * Intro terminal — the home page's introductory text, styled as a terminal.
 * On the first full page load (desktop only) it types the subtitle then the body
 * out character-by-character with a blinking cursor; clicking finishes instantly.
 * Renders the subtitle + body from the 'pages/home-intro.yaml' content file.
 * Title and section nav live in HomeView, not here.
 */
import { computed, onMounted, ref, type Ref } from 'vue'
import type { ResolvedSection } from '@/types/page'

const props = defineProps<{ section: ResolvedSection }>()

const content = computed(() => props.section.content as {
  subtitle?: string
  body?: string
} | null | undefined)

const displaySubtitle = ref('')
const displayBody = ref('')
// Which line the cursor sits on; 'done' = finished (no cursor, no pointer).
const phase = ref<'subtitle' | 'body' | 'done'>('done')

let skip = false

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// Mostly fast, with the occasional slightly longer beat to feel hand-typed.
function typingDelay(): number {
  return Math.random() < 0.08 ? 90 + Math.random() * 90 : 12 + Math.random() * 33
}

async function typeInto(target: Ref<string>, text: string): Promise<void> {
  for (let i = 0; i < text.length; i++) {
    if (skip) break
    target.value += text[i]
    await delay(typingDelay())
  }
  if (skip) target.value = text // jump to full on click
}

function finishNow(): void {
  if (phase.value === 'done') return
  skip = true
}

onMounted(async () => {
  const sub = content.value?.subtitle ?? ''
  const body = content.value?.body ?? ''

  // Animate only on the first load, on screens wide enough for the side panel
  // (phones would grow page height as it types), and when motion is allowed.
  const wideEnough = window.matchMedia('(min-width: 768px)').matches
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (hasAutoTyped || !wideEnough || reduceMotion) {
    displaySubtitle.value = sub
    displayBody.value = body
    phase.value = 'done'
    return
  }

  hasAutoTyped = true
  phase.value = 'subtitle'
  await typeInto(displaySubtitle, sub)
  phase.value = 'body'
  await typeInto(displayBody, body)
  phase.value = 'done'
})
</script>

<template>
  <section
    class="intro-terminal shape-chamfer"
    :class="{ 'is-typing': phase !== 'done' }"
    @click="finishNow"
  >
    <div class="intro-scroll">
      <template v-if="content">
        <p v-if="content.subtitle" class="intro-subtitle">
          {{ displaySubtitle }}<span v-if="phase === 'subtitle'" class="cursor">_</span>
        </p>
        <p v-if="content.body">
          {{ displayBody }}<span v-if="phase === 'body'" class="cursor">_</span>
        </p>
      </template>
      <p v-else>Hero content not yet loaded.</p>
    </div>
  </section>
</template>

<style scoped>
@reference "tailwindcss";

/* Old-terminal look: glass fill matching the content cards, green chamfer border
   ring, monospace text in bright green with a soft green glow. */
.intro-terminal {
  --shape-fill: var(--color-bg-glass);
  --shape-border: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-primary-light);
  text-shadow: 0 0 6px var(--color-primary);
}

.intro-scroll {
  padding: 1rem 1.25rem;
}

/* While auto-typing, signal the whole panel is clickable (click = finish). */
.intro-terminal.is-typing {
  cursor: pointer;
}

/* Underline cursor — inherits the green colour + glow from the text. */
.cursor {
  animation: cursor-blink 1.05s step-end infinite;
}

@keyframes cursor-blink {
  50% {
    opacity: 0;
  }
}

/* Desktop: the shape stays put while an inner element scrolls — the chamfer ring
   is an absolutely-positioned pseudo-element, so it must NOT scroll. Mobile:
   natural height flow (unchanged). */
@media (width >= theme(--breakpoint-md)) {
  .intro-terminal {
    flex: 1;
    min-height: 0;
    display: flex;
  }

  .intro-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
