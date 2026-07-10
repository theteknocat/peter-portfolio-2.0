<script setup lang="ts">
// Clippy companion: startup + dismissal.
//
// - Loads only on tablet+ viewports (never on phones — too space-hungry).
// - First appearance waits for the router, then a deliberate beat, so he
//   "notices" the visitor rather than ambushing them. Respects reduced motion.
// - Dismissal is persistent (gone means gone); the footer's "summon" button
//   brings him back via shared state in useClippy().
import { nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LoaderCircle, X } from '@lucide/vue'
import { routes } from '@/router'
import { useClippy } from '@/composables/useClippy'
import { useClippyQuips } from '@/composables/useClippyQuips'
import { actionsFor, type ClippyAction } from '@/composables/clippyActions'
import ClippyMessage from './ClippyMessage.vue'

// clippyjs's generated types mark these method params as required, but the
// runtime treats them as optional. Declare the subset we drive with the real
// signatures so show()/speak(text)/hide() typecheck in-editor.
interface Agent {
  show(fast?: boolean): void
  hide(fast?: boolean): void
  // The agent's fixed-position root element. Under reduced motion we write his
  // top/left directly (fast-show skips clippyjs's own default positioning).
  _el: HTMLElement
  // Clamps an x/y into the viewport (accounts for his size + a 5px margin).
  _clampXY(x: number, y: number): { x: number; y: number }
  // Re-clamps the agent into the viewport and repositions the balloon under it.
  reposition(): void
  play(name: string): void
  speak(text: string, hold?: boolean): void
  // Queue a balloon action to run after the entrance animation drains. We wrap
  // it ourselves (rather than Agent.speak) so the entrance can fit buttons too.
  _addToQueue(func: (complete: () => void) => void): void
  // Clears the queue, exits the current animation, and hides the balloon —
  // used to cancel an in-flight quip when the visitor navigates again.
  stop(): void
  dispose(): void
  // clippyjs internals. CLOSE_BALLOON_DELAY is the balloon's post-text close
  // delay (ms); we override it per-quip so longer lines linger (see readingDelay).
  // _balloon is the Balloon instance. `_balloon._balloon` is the bubble <div>
  // (we teleport buttons into it); `close()` releases a held bubble — which
  // clippyjs otherwise leaves stuck, blocking the queue (see closeBubble);
  // `hide(true)` collapses it instantly.
  // _active is true while the bubble is writing out words; _hold is true while a
  // held (button) bubble stays open. We read both to skip stacking a quip onto a
  // busy bubble (see speakForScope).
  _balloon: {
    CLOSE_BALLOON_DELAY: number
    _balloon: HTMLElement
    _content: HTMLElement
    _active: boolean
    _hold: boolean
    // True once the balloon is fully hidden. show() no-ops while it's true;
    // only the non-fast hide() path sets it (after CLOSE_BALLOON_DELAY), so
    // our own fast-path close in closeBubble() has to set it directly (see
    // there for why that matters).
    _hidden: boolean
    close(): void
    hide(fast?: boolean): void
    // Cancels the balloon's pending timers (word loop + the delayed _finishHideBalloon
    // that stop()'s non-fast hide schedules). Without this the stale hide fires into a
    // live bubble, closing a held one and wedging _hold=true (blocks all later quips).
    pause(): void
    // Direct speak (not Agent.speak, which queues behind play()) so the bubble shows
    // WITH the gesture; complete fires on finish. reposition re-measures the balloon —
    // needed after the buttons teleport in, since speak() positioned it button-less.
    speak(complete: () => void, text: string, hold: boolean): void
    reposition(): void
  }
}

const router = useRouter()
const route = useRoute()
const { dismissed, active, allowed, summoning, dismiss } = useClippy()
const { nextQuip, prefetch } = useClippyQuips()

const agent = shallowRef<Agent | null>(null)
// clippyjs's own <div> (the agent's internal element). We teleport the dismiss
// button into it so the button tracks the widget — including when it's dragged.
const agentEl = shallowRef<HTMLElement | null>(null)
// The balloon's outer <div>, exposed so we can teleport action buttons into it.
const balloonEl = shallowRef<HTMLElement | null>(null)
// Buttons for the bubble currently on screen. Set per-quip from actionsFor(scope);
// empty only if the scope has no buttons defined.
const currentActions = shallowRef<ClippyAction[]>([])
// True while a quip pool fetch is in flight (uncached scope) — swaps the
// dismiss button for a disabled spinner so a slow load doesn't look frozen.
const isLoadingQuip = shallowRef(false)

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
  experience: [
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
 * Resolve a quip for a scope: server pool first, built-in LINES as fallback.
 * Async because the first quip for a scope fetches its pool.
 */
async function quipFor(scope: string): Promise<string | null> {
  const section = scope.split('/')[0]
  const fallback = LINES[section]
  return (await nextQuip(scope)) ?? (fallback ? pick(fallback) : null)
}

// Top-level section scopes, derived from the router: static paths only
// (detail/modal routes and the 404 catch-all all contain ':').
const prefetchScopes = routes
  .filter((r) => typeof r.path === 'string' && !r.path.includes(':'))
  .map((r) => scopeOf(r.path))

let idlePrefetchDone = false

/**
 * Warm the other top-level quip pools during browser idle, so navigating to a
 * section serves its first quip from cache instead of waiting on the API. Runs
 * once per session; the fetches themselves are session-deduped by loadPool().
 */
function scheduleIdlePrefetch(): void {
  if (idlePrefetchDone || typeof window === 'undefined') return
  idlePrefetchDone = true

  const run = (): void => {
    if (dismissed.value) return // user left before idle fired
    const current = scopeOf(route.path)
    for (const scope of prefetchScopes) {
      if (scope !== current) void prefetch(scope)
    }
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2000 })
  } else {
    window.setTimeout(run, 1000)
  }
}

/** Speak a quip for a scope (navigation): random gesture, cancel anything mid-flight. */
async function speakForScope(scope: string): Promise<void> {
  if (!agent.value || !active.value) return // not loaded yet, or off-screen
  const a = agent.value
  // Busy bubble: still writing, or holding buttons. Leave it standing rather
  // than stacking/interrupting (clippyjs has no clean mid-write abort; skipping
  // is the simpler, accepted tradeoff). Button clicks close it explicitly.
  if (a._balloon._active || a._balloon._hold) return
  isLoadingQuip.value = true
  const quip = await quipFor(scope)
  isLoadingQuip.value = false
  if (!quip || !agent.value || !active.value) return // no line, or navigated away mid-fetch
  a.stop() // cancel any still-running quip so they don't stack on fast nav
  a._balloon.pause() // stop()'s non-fast hide scheduled a delayed _finishHideBalloon; cancel
  // it or it fires mid-quip, closing a held bubble and wedging _hold=true (blocks later quips)
  a._balloon.hide(true) // collapse a finished-but-not-yet-closed bubble NOW so its stale
  // text can't show under the incoming buttons while the gesture plays
  if (!reduceMotion) a.play(randomGesture())
  say(a, quip, scope, true) // concurrent: bubble shows alongside the gesture
}

// Gag buttons: each maps to an animation and a canned punchline. Pure bits, no
// navigation — the joke is that the "help" does nothing useful.
const GAGS: Record<string, { play: string; line: string }> = {
  enhance: {
    play: 'Processing',
    line: 'Enhancing. Enhancing. There — it looks exactly the same, but now you feel watched.',
  },
  print: {
    play: 'Print',
    line: "Sent to your fax machine. It looks like you don't have a fax machine. We'll keep trying.",
  },
  summarize: {
    play: 'GetTechy',
    line: 'Summary: it is good. I am told four thousand words went into it. I have given you four.',
  },
  wordart: {
    play: 'GetArtsy',
    line: 'Rendered in glorious WordArt. Peter asked me not to. That is precisely why I did.',
  },
}

/**
 * Speak a quip and attach the scope's action buttons, holding the bubble open
 * so they stay clickable (no auto-close reading delay applies).
 */
function say(a: Agent, quip: string, scope: string, concurrent = false): void {
  const acts = actionsFor(scope)
  currentActions.value = acts
  const hold = acts.length > 0
  a._balloon._content.style.maxWidth = '200px' // reset; a prior button bubble may have widened it
  if (concurrent) {
    // Speak straight on the balloon so it shows alongside the gesture (Agent.speak
    // would queue behind play()). Buttons teleport in async, so once they've mounted
    // widen the text to fill the balloon they stretched, then reposition.
    a._balloon.speak(() => {}, quip, hold)
    if (hold) nextTick(() => fitContentToButtons(a, quip))
  } else {
    // queued: used on first load/re-summon so the bubble follows the entrance.
    // Wrap the queued balloon.speak so we can fit the text once it actually shows
    // (the buttons teleported in synchronously, but the bubble only measures here).
    a._addToQueue((complete) => {
      a._balloon.speak(complete, quip, hold)
      if (hold) fitContentToButtons(a, quip)
    })
  }
}

/**
 * Widen the speech-bubble text column to fill a balloon the button row stretched.
 *
 * speak() pins _content to its ≤200px text width/height; once the wider button
 * <menu> sibling teleports in, the text looks cramped in a wide bubble. Re-pin at
 * the inner balloon width — re-measuring height too, since fewer wrap lines need
 * less height (skipping that would leave a gap above the buttons). Both the
 * concurrent path (nav, reduced-motion entrance) and the queued full-motion
 * entrance call this.
 *
 * @param a - The agent whose balloon to fit.
 * @param text - The full quip, for the height re-measure.
 */
function fitContentToButtons(a: Agent, text: string): void {
  const c = a._balloon._content
  const inner = a._balloon._balloon.clientWidth - 16 // strip the balloon's 8px padding
  if (inner <= c.offsetWidth) { // buttons no wider than the text — nothing to fill
    a._balloon.reposition()
    return
  }
  c.style.maxWidth = inner + 'px'
  c.style.width = 'auto'
  c.style.height = 'auto'
  const typed = c.textContent // whatever _sayWords has written so far
  c.textContent = text // measure the full line at the new width
  c.style.height = c.offsetHeight + 'px'
  c.style.width = c.offsetWidth + 'px'
  c.textContent = typed // restore the in-progress text; _sayWords keeps typing
  a._balloon.reposition()
}

/**
 * Close a held (button-bearing) bubble. A held bubble never fires clippyjs's
 * queue-completion callback, so the queue stays stuck and blocks every later
 * play()/speak(). `close()` fires that callback (freeing the queue); `hide(true)`
 * collapses the bubble now.
 */
function closeBubble(): void {
  const a = agent.value
  if (!a) return
  currentActions.value = [] // unmount the teleported buttons
  a._balloon.close() // release the hold → fires the queue completion, unsticking it
  a._balloon._hold = false // close() leaves _hold set; clear it so the next quip isn't skipped
  a._balloon.hide(true) // collapse the bubble immediately
  // hide(true) is the fast path — it skips setting _hidden (only the delayed
  // non-fast hide does, via _finishHideBalloon). Without it, Agent._finishDrag()
  // — which fires on every click *and* drag, since a click is a zero-distance
  // drag — unconditionally calls balloon.show() next time, popping the stale,
  // button-less bubble back up. speak() resets this to false on the next quip.
  a._balloon._hidden = true
}

/** A gag button was clicked: close the held bubble, play the bit, deliver the punchline. */
function onGag(key: string): void {
  const a = agent.value
  const gag = GAGS[key]
  if (!a || !gag) return
  closeBubble() // frees the queue so the punchline can actually speak
  if (!reduceMotion) a.play(gag.play)
  a._balloon.CLOSE_BALLOON_DELAY = readingDelay(gag.line)
  a.speak(gag.line) // fresh, auto-closing bubble
}

let started = false
let positioned = false
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Run the entrance: show, greet, then speak a line for whatever scope the
 *  visitor landed on. Used on first load and on re-summon. */
async function reveal(): Promise<void> {
  const a = agent.value
  if (!a) return
  if (reduceMotion) {
    a.show(true) // instant, no entrance animation
    // clippyjs's fast-show skips the default positioning its normal show() does,
    // leaving top/left:auto so he lands offscreen. Place him once; drag survives re-summon.
    if (!positioned) {
      // Place him synchronously; moveTo() queues, so its reposition would fire
      // before he's moved. The concurrent speak path below repositions the
      // balloon once he's seeded here.
      const { x, y } = a._clampXY(window.innerWidth * 0.8, window.innerHeight * 0.8)
      a._el.style.left = `${x}px`
      a._el.style.top = `${y}px`
      positioned = true
    }
  } else {
    a.show()
    a.play('Greeting')
  }
  active.value = true
  summoning.value = false // he's on screen now — release the footer summon button
  const scope = scopeOf(route.path)
  isLoadingQuip.value = true
  const quip = await quipFor(scope)
  isLoadingQuip.value = false
  if (!quip || !agent.value || !active.value) return // dismissed mid-fetch
  // Reduced motion has no entrance animation to wait for, so speak concurrently:
  // the bubble shows + repositions with him, and held (button) bubbles get fitted
  // via nextTick once the buttons teleport in (see say()'s concurrent branch).
  say(a, quip, scope, reduceMotion)
}

/** Hide him without disposing, so a later summon can re-show instantly. */
function conceal(): void {
  closeBubble() // collapse the bubble immediately, in sync with the buttons vanishing
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
  balloonEl.value = a._balloon._balloon
  reveal()
  scheduleIdlePrefetch()
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
    <button class="clippy-dismiss" :disabled="isLoadingQuip" aria-label="Dismiss Clippy" @click="onDismiss">
      <LoaderCircle v-if="isLoadingQuip" class="clippy-dismiss-spinner" :size="16" />
      <X v-else :size="16" />
    </button>
  </Teleport>

  <!-- Action buttons, teleported into the speech bubble itself (see ClippyMessage).
       Only present while a button-bearing quip is held open. -->
  <ClippyMessage
    v-if="balloonEl && active && currentActions.length"
    :to="balloonEl"
    :actions="currentActions"
    @gag="onGag"
    @nav="closeBubble"
    @close="closeBubble"
  />
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

.clippy-dismiss:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.clippy-dismiss-spinner {
  animation: clippy-dismiss-spin 1s linear infinite;
}

@keyframes clippy-dismiss-spin {
  to { transform: rotate(360deg); }
}
</style>
