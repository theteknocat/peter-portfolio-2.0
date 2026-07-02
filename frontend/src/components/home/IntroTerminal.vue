<script lang="ts">
// True module scope: evaluated once on import, shared across all mounts. The
// typewriter runs once per full page load and never again on in-SPA navigation
// back to home (remounts read the same flag). A hard refresh resets it.
let hasAutoTyped = false
</script>

<script setup lang="ts">
/**
 * Intro terminal — the home page's introductory text, styled as a terminal.
 * On the first full page load (desktop only) it types the subtitle, then the
 * body, then a Tron "END OF LINE" sign-off, out character-by-character with a
 * blinking cursor; clicking finishes instantly.
 * Renders the subtitle + body from the 'pages/home-intro.yaml' content file.
 * Title and section nav live in HomeView, not here.
 */
import { computed, onMounted, onUnmounted, ref, type Ref } from 'vue'
import type { ResolvedSection } from '@/types/page'

const props = defineProps<{ section: ResolvedSection }>()

const content = computed(() => props.section.content as {
  subtitle?: string
  body?: string
} | null | undefined)

// Scroll indicators: shown only when .intro-scroll actually overflows, and
// only on the edge(s) there's still more to see.
const scrollEl = ref<HTMLElement | null>(null)
const canScrollUp = ref(false)
const canScrollDown = ref(false)
let resizeObserver: ResizeObserver | null = null
let contentObserver: MutationObserver | null = null

function updateScrollIndicators(): void {
  const el = scrollEl.value
  if (!el) return
  const scrollable = el.scrollHeight > el.clientHeight + 1
  canScrollUp.value = scrollable && el.scrollTop > 4
  canScrollDown.value = scrollable && el.scrollTop < el.scrollHeight - el.clientHeight - 4
}

const displaySubtitle = ref('')
const displayBody = ref('')
const displayTron = ref('')
// Which line the cursor sits on; 'done' = finished typing (pointer cursor cleared).
const phase = ref<'subtitle' | 'body' | 'tron' | 'done'>('done')
const cursorVisible = ref(false)

let skip = false

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

// Like delay(), but returns early if the user clicks to skip ahead.
async function pause(ms: number): Promise<void> {
  const start = Date.now()
  while (!skip && Date.now() - start < ms) {
    await delay(Math.min(50, ms))
  }
}

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
    displayBody.value = '\n' + body + '\n\n'
    displayTron.value = 'END OF LINE'
    phase.value = 'done'
    return
  }

  cursorVisible.value = true
  hasAutoTyped = true
  await pause(800)
  phase.value = 'subtitle'
  await typeInto(displaySubtitle, sub)
  phase.value = 'body'
  await typeInto(displayBody, '\n');
  await pause(1000)
  await typeInto(displayBody, body + '\n\n')

  // Tron easter egg: MCP's "END OF LINE" sign-off, its own line/paragraph.
  await pause(2000)
  phase.value = 'tron'
  await typeInto(displayTron, 'END OF LINE')
  phase.value = 'done'
  await pause(3000)
  cursorVisible.value = false
})

onMounted(() => {
  updateScrollIndicators()
  const el = scrollEl.value
  if (!el) return
  // ResizeObserver catches the box itself resizing (e.g. viewport/header
  // height changes). It does NOT fire when content grows inside a fixed-size
  // box, so the typewriter's per-character text growth needs a separate
  // MutationObserver on the text nodes.
  resizeObserver = new ResizeObserver(updateScrollIndicators)
  resizeObserver.observe(el)
  contentObserver = new MutationObserver(updateScrollIndicators)
  contentObserver.observe(el, { childList: true, subtree: true, characterData: true })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  contentObserver?.disconnect()
})
</script>

<template>
  <section
    class="intro-terminal shape-chamfer"
    :class="{ 'is-typing': phase !== 'done' }"
    @click="finishNow"
  >
    <div ref="scrollEl" class="intro-scroll" @scroll="updateScrollIndicators">
      <template v-if="content">
        <p v-if="content.subtitle" class="intro-subtitle">
          {{ displaySubtitle }}<span v-if="phase === 'subtitle'" class="cursor">_</span>
        </p>
        <p v-if="content.body" class="intro-body">
          {{ displayBody }}<span v-if="phase === 'body' && cursorVisible" class="cursor">_</span>
        </p>
        <p v-if="phase === 'tron' || phase === 'done'" class="intro-tron">
          &nbsp;{{ displayTron }}<span v-if="cursorVisible" class="cursor">_</span><span v-else>&nbsp;</span>
        </p>
      </template>
      <p v-else>Hero content not yet loaded.</p>
    </div>
    <Transition name="scroll-indicator-fade">
      <span v-if="canScrollUp" class="scroll-indicator scroll-indicator--up" aria-hidden="true" />
    </Transition>
    <Transition name="scroll-indicator-fade">
      <span v-if="canScrollDown" class="scroll-indicator scroll-indicator--down" aria-hidden="true" />
    </Transition>
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

/* Trailing typed newline gives the blank-line gap before the body; centered
   to read as a standalone heading rather than body copy. */
.intro-subtitle {
  margin: 0;
  text-align: center;
  white-space: pre-line;
}

/* Honour newlines authored in the YAML body (literal `|` block scalar) while
   still wrapping long lines and collapsing incidental indentation whitespace. */
.intro-body {
  margin: 0;
  white-space: pre-line;
  line-height: 1.3;
}

/* Sits flush under .intro-body — the gap comes from body's trailing typed
   newline, not a margin here. */
.intro-tron {
  margin: 0;
  text-align: center;
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

/* Wide, short chevrons that only appear when .intro-scroll actually overflows
   (toggled in script), signalling more content in that direction. Sit above
   the shape-chamfer border pseudo-elements (z-index: -1/-2) but ignore clicks
   so the panel's click-to-skip handler still works underneath. */
.scroll-indicator {
  position: absolute;
  left: 50%;
  translate: -50% 0;
  width: 40%;
  height: 0.35rem;
  background: var(--color-primary-light);
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}

.scroll-indicator--down {
  bottom: -0.35rem;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.scroll-indicator--up {
  top: -0.35rem;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.scroll-indicator-fade-enter-active,
.scroll-indicator-fade-leave-active {
  transition: opacity 0.3s ease;
}

.scroll-indicator-fade-enter-from,
.scroll-indicator-fade-leave-to {
  opacity: 0;
}
</style>
