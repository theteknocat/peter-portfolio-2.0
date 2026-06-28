import { ref } from 'vue'

/**
 * Shared Clippy state, used by both the companion widget and the footer's
 * "summon" button.
 *
 * The refs live at module scope (not inside the function), so every component
 * that calls `useClippy()` gets the *same* reactive values — a one-file
 * singleton store. This is the Composition-API stand-in for a Vue 2 global
 * event bus / a tiny Pinia store.
 */

const STORAGE_KEY = 'clippy-dismissed'

/** True once the user has dismissed Clippy. Persisted: gone means gone. */
const dismissed = ref(
  typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1',
)

/** True while the agent is actually on screen (drives the footer button). */
const active = ref(false)

/**
 * True from a footer summon-click until Clippy is actually on screen. Keeps the
 * footer button visible (as a spinner) during the reveal delay so it doesn't
 * vanish the instant `dismissed` flips — which felt broken. Cleared by the
 * companion once `active` goes true.
 */
const summoning = ref(false)

/** True on client + non-phone viewports. Set by ClippyCompanion on mount. */
const allowed = ref(false)

export function useClippy() {
  /** Hide Clippy and remember it across visits. */
  function dismiss(): void {
    active.value = false
    dismissed.value = true
    localStorage.setItem(STORAGE_KEY, '1')
  }

  /** Bring Clippy back (from the footer button). */
  function summon(): void {
    localStorage.removeItem(STORAGE_KEY)
    summoning.value = true
    dismissed.value = false
  }

  return { dismissed, active, allowed, summoning, dismiss, summon }
}
