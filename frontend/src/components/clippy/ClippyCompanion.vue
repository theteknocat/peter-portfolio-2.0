<script setup lang="ts">
// Clippy companion: startup + dismissal.
//
// - Loads only on tablet+ viewports (never on phones — too space-hungry).
// - First appearance waits for the router, then a deliberate beat, so he
//   "notices" the visitor rather than ambushing them. Respects reduced motion.
// - Dismissal is persistent (gone means gone); the footer's "summon" button
//   brings him back via shared state in useClippy().
import { onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import { useClippy } from '@/composables/useClippy'

// clippyjs's generated types mark these method params as required, but the
// runtime treats them as optional. Declare the subset we drive with the real
// signatures so show()/speak(text)/hide() typecheck in-editor.
interface Agent {
  show(fast?: boolean): void
  hide(fast?: boolean): void
  play(name: string): void
  speak(text: string, hold?: boolean): void
  dispose(): void
}

const router = useRouter()
const route = useRoute()
const { dismissed, active, allowed, dismiss } = useClippy()

const agent = shallowRef<Agent | null>(null)
// clippyjs's own <div> (the agent's internal element). We teleport the dismiss
// button into it so the button tracks the widget — including when it's dragged.
const agentEl = shallowRef<HTMLElement | null>(null)

// First-appearance lines (first load + every re-summon). Picked at random.
const WELCOME = [
  "It looks like you're visiting Peter's portfolio. Need a hand? I have exactly one.",
  "It looks like you're judging a stranger's career. I'm legally obligated to help.",
  "It looks like you opened a portfolio in 2026 and got Clippy. Bold of both of us.",
  "Hi. It looks like you're about to be impressed. I'll wait.",
]
const FIRST_SHOW_DELAY_MS = 2500

// Per-section quips. He speaks one at random when you navigate into a *new*
// section — never on movement within one, so opening a project/article modal
// doesn't re-trigger him. 2 lines each so a repeat visitor isn't hit with the
// same string. Register: earnest help, absurdly misapplied; dry, self-aware.
const LINES: Record<string, { anim: string; text: string[] }> = {
  home: {
    anim: 'Greeting',
    text: [
      "It looks like you're back at the start. Bold strategy. Want the tour again?",
      "Welcome back to square one. I won't judge — that's not in my feature set.",
    ],
  },
  portfolio: {
    anim: 'GetTechy',
    text: [
      "It looks like you're evaluating someone's life's work. Take your time — he can't see you doing it.",
      "Projects, projects. It looks like you're deciding whether to be impressed. I recommend yes.",
    ],
  },
  articles: {
    anim: 'GetArtsy',
    text: [
      "It looks like you're after opinions about AI. Peter has several. I am one of them.",
      "Words! It looks like you're about to read on purpose. How retro. I approve.",
    ],
  },
  'job-history': {
    anim: 'GetAttention',
    text: [
      "It looks like you're checking whether Peter is employable. He is. I'd stake my entire existence on it.",
      "Ah, the résumé portion. It looks like you're doing due diligence. I already vouched for him.",
    ],
  },
}

/** Random element of a non-empty array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** First path segment, or 'home' for '/'. */
function sectionOf(path: string): string {
  return path.split('/')[1] || 'home'
}

/** Speak a random quip for the section (if he's loaded and on screen). */
function speakForSection(section: string): void {
  const a = agent.value
  if (!a || !active.value) return // not loaded yet, or dismissed/off-screen
  const line = LINES[section]
  if (!line) return
  if (!reduceMotion) a.play(line.anim)
  a.speak(pick(line.text))
}

let started = false
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Run the entrance: show, greet, speak. Used on first load and on re-summon. */
function reveal(): void {
  const a = agent.value
  if (!a) return
  if (reduceMotion) {
    a.show(true) // instant, no entrance animation
  } else {
    a.show()
    a.play('Greeting')
  }
  a.speak(pick(WELCOME))
  active.value = true
}

/** Hide him without disposing, so a later summon can re-show instantly. */
function conceal(): void {
  agent.value?.hide()
  active.value = false
}

/** First-ever appearance: load the library lazily after a deliberate beat. */
async function firstShow(): Promise<void> {
  await router.isReady()
  if (!reduceMotion) {
    await new Promise<void>(resolve => setTimeout(resolve, FIRST_SHOW_DELAY_MS))
  }
  // Dynamic import keeps the browser-only library out of the SSG prerender
  // and out of the main bundle.
  const { initAgent } = await import('clippyjs')
  const { Clippy } = await import('clippyjs/agents')

  // Silence him: load with an empty sound map (clippyjs has no mute API).
  // Browsers block autoplay on load anyway, so the only time audio fired was a
  // user-triggered re-summon — which was jarring.
  // ponytail: cast through unknown — clippyjs's real return type has wrong
  // (required) param signatures, and _el is private. Dep is pinned (0.1.0);
  // revisit if a future version fixes the types / exposes the element.
  const a = (await initAgent({
    ...Clippy,
    sound: () => Promise.resolve({ default: {} }),
  })) as unknown as Agent & { _el: HTMLElement }
  agent.value = a
  agentEl.value = a._el
  reveal()
}

function onDismiss(): void {
  dismiss() // flips `dismissed`; the watcher below conceals him
}

onMounted(() => {
  // Phones: skip entirely. Tablets+ (smaller dimension >= 600px) are fine.
  allowed.value = Math.min(window.innerWidth, window.innerHeight) >= 600
  if (!allowed.value) return

  watch(
    dismissed,
    (isDismissed) => {
      if (isDismissed) {
        conceal()
      } else if (!started) {
        started = true
        firstShow()
      } else {
        reveal()
      }
    },
    { immediate: true },
  )

  // Navigation quips: fire only when the *section* changes (so portfolio →
  // a project modal stays quiet). No `immediate` — first load is the welcome
  // line's job, not this watcher's.
  let lastSection = sectionOf(route.path)
  watch(
    () => route.path,
    (path) => {
      const section = sectionOf(path)
      if (section === lastSection) return
      lastSection = section
      speakForSection(section)
    },
  )
})

onUnmounted(() => agent.value?.dispose())
</script>

<template>
  <!-- The agent itself renders into <body>; only the dismiss button is ours.
       Teleported into clippyjs's element so it follows the widget. -->
  <Teleport v-if="agentEl && active" :to="agentEl">
    <button class="clippy-dismiss" aria-label="Dismiss Clippy" @click="onDismiss">
      <X :size="16" />
    </button>
  </Teleport>
</template>

<style scoped>
/* Round close button, top-right corner of the widget — mirrors .modal-close. */
.clippy-dismiss {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0.33rem;
  color: var(--color-accent);
  background: var(--color-bg-dark);
  border: 0.06rem solid var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.clippy-dismiss:hover,
.clippy-dismiss:focus-visible {
  color: var(--color-primary-light);
  border-color: var(--color-primary-light);
}
</style>
