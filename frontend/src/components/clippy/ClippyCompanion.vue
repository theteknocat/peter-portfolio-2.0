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
import { useClippyQuips } from '@/composables/useClippyQuips'

// clippyjs's generated types mark these method params as required, but the
// runtime treats them as optional. Declare the subset we drive with the real
// signatures so show()/speak(text)/hide() typecheck in-editor.
interface Agent {
  show(fast?: boolean): void
  hide(fast?: boolean): void
  play(name: string): void
  speak(text: string, hold?: boolean): void
  dispose(): void
  // clippyjs internal: the balloon's post-text close delay (ms). We override
  // it per-quip so longer lines linger long enough to read. See readingDelay.
  _balloon: { CLOSE_BALLOON_DELAY: number }
}

const router = useRouter()
const route = useRoute()
const { dismissed, active, allowed, dismiss } = useClippy()
const { nextQuip } = useClippyQuips()

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

// Built-in fallback quips, keyed by section. Used when the server quip pool for
// a scope is empty (API down, no key, or item with no pool).
// Register: earnest help, absurdly misapplied; dry, self-aware.
const LINES: Record<string, string[]> = {
  home: [
    "It looks like you're back at the start. Bold strategy. Want the tour again?",
    "Welcome back to square one. I won't judge — that's not in my feature set.",
  ],
  portfolio: [
    "It looks like you're evaluating someone's life's work. Take your time — he can't see you doing it.",
    "Projects, projects. It looks like you're deciding whether to be impressed. I recommend yes.",
  ],
  articles: [
    "It looks like you're after opinions about AI. Peter has several. I am one of them.",
    "Words! It looks like you're about to read on purpose. How retro. I approve.",
  ],
  'job-history': [
    "It looks like you're checking whether Peter is employable. He is. I'd stake my entire existence on it.",
    "Ah, the résumé portion. It looks like you're doing due diligence. I already vouched for him.",
  ],
}

// Gestures Clippy plays on navigation. Curated: expressive gestures + office-prop
// gags. Excludes Greeting (reserved for the entrance), the staring Look* set,
// idle loops (auto-played), and lifecycle animations. See docs/clippy-companion.md.
const GESTURES = [
  'Wave', 'Congratulate', 'GetTechy', 'GetWizardy', 'GetArtsy',
  'Searching', 'Thinking', 'Processing', 'Writing', 'Explain',
  'CheckingSomething', 'Alert', 'Hearing_1', 'Print', 'SendMail', 'Save',
  'EmptyTrash',
]

/** Random element of a non-empty array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

let lastGesture = ''
/** A random gesture from GESTURES, never the same one twice in a row. */
function randomGesture(): string {
  let g = pick(GESTURES)
  while (g === lastGesture) g = pick(GESTURES)
  return (lastGesture = g)
}

/** Reading dwell (ms) for the speech bubble. clippyjs's default is a flat 2s
 *  that doesn't scale, so longer quips feel cut off. Scale by word count
 *  (~215 wpm), clamped to a sane floor/ceiling. */
function readingDelay(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.min(Math.max(words * 280, 2500), 9000)
}

/** Path → quip scope. '/' is 'home'; item routes keep their slug. */
function scopeOf(path: string): string {
  return path.replace(/^\/+/, '') || 'home'
}

/**
 * Speak a quip for a scope: server pool first, built-in LINES as fallback.
 * Async because the first quip for a scope fetches its pool.
 */
async function speakForScope(scope: string): Promise<void> {
  if (!agent.value || !active.value) return // not loaded yet, or off-screen
  const section = scope.split('/')[0]
  const fallback = LINES[section]
  const quip = (await nextQuip(scope)) ?? (fallback ? pick(fallback) : null)
  const a = agent.value
  if (!quip || !a || !active.value) return // no line, or navigated away mid-fetch
  if (!reduceMotion) a.play(randomGesture())
  a._balloon.CLOSE_BALLOON_DELAY = readingDelay(quip)
  a.speak(quip)
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
  const line = pick(WELCOME)
  a._balloon.CLOSE_BALLOON_DELAY = readingDelay(line)
  a.speak(line)
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
  })) as unknown as Agent & {
    _el: HTMLElement
    _idlePromise: Promise<void> | null
    _isIdleAnimation(): boolean
    _animator: {
      showAnimation(name: string, cb: unknown): void
      exitAnimation(): void
    }
    _playInternal(animation: string, callback: unknown): void
  }

  // ponytail: clippyjs defers play()/hide()/show() behind an idle "exit"
  // promise so the idle finishes its wake-up branch first — nice, except idles
  // with no exit branch never resolve it and deadlock every later action. Keep
  // the graceful wait but cap it: trigger the idle's exit, race its completion
  // against a short grace window, then swap to the requested animation.
  const IDLE_EXIT_GRACE_MS = 1800
  a._playInternal = function (animation, callback) {
    if (!a._isIdleAnimation() || !a._idlePromise) {
      a._animator.showAnimation(animation, callback)
      return
    }
    let started = false
    const start = () => {
      if (started) return
      started = true
      a._animator.showAnimation(animation, callback)
    }
    a._idlePromise.then(start)
    a._animator.exitAnimation()
    window.setTimeout(start, IDLE_EXIT_GRACE_MS)
  }

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

  // Navigation quips: fire when the *scope* changes. Opening a project/article
  // modal is a scope change (its own quip), but closing one (returning from an
  // item scope to any section) is skipped. No `immediate`: first load is the
  // welcome line's job, not this watcher's.
  let lastScope = scopeOf(route.path)
  watch(
    () => route.path,
    (path) => {
      const scope = scopeOf(path)
      if (scope === lastScope) return
      const prev = lastScope
      lastScope = scope
      // Item scopes have a slash. Returning from an item to any section is a
      // modal close (no quip); item→item and section→item still quip.
      const closingModal = prev.includes('/') && !scope.includes('/')
      if (!closingModal) speakForScope(scope)
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
