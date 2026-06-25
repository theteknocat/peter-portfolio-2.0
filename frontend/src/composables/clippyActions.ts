// Per-scope action buttons shown inside Clippy's speech bubble. Frontend-only
// (never from the API) — canned navigation plus the odd absurd gag.

/** A button that navigates somewhere real. */
interface NavButton {
  kind: 'nav'
  label: string
  to: string
}

/** A button that does something silly in-place (no navigation). */
interface GagButton {
  kind: 'gag'
  label: string
  gag: string // key the companion maps to an animation + canned line
}

/** Discriminated union: `kind` tells the two apart at the type level. */
export type ClippyAction = NavButton | GagButton

/**
 * Buttons keyed by section scope. Item scopes ({type}/{slug}) fall back to
 * their section's set via the first path segment.
 */
export const ACTIONS: Record<string, ClippyAction[]> = {
  home: [
    { kind: 'nav', label: 'See his projects', to: '/portfolio' },
    { kind: 'nav', label: 'Read his ramblings', to: '/articles' },
    { kind: 'gag', label: 'Enhance', gag: 'enhance' },
  ],
  portfolio: [
    { kind: 'nav', label: 'Is he hireable?', to: '/job-history' },
    { kind: 'gag', label: 'Print to fax', gag: 'print' },
  ],
  articles: [
    { kind: 'nav', label: 'Show me his work', to: '/portfolio' },
    { kind: 'gag', label: 'Summarize in Clippy', gag: 'summarize' },
  ],
  'job-history': [
    { kind: 'nav', label: 'See the proof', to: '/portfolio' },
    { kind: 'gag', label: 'Format as WordArt', gag: 'wordart' },
  ],
}

/**
 * Resolve the action set for a scope, falling back to the section's set for
 * item scopes ({type}/{slug}).
 *
 * @param scope - The current quip scope (e.g. 'home', 'portfolio/some-slug').
 * @returns The buttons for that scope, or an empty array if none are defined.
 */
export function actionsFor(scope: string): ClippyAction[] {
  return ACTIONS[scope] ?? ACTIONS[scope.split('/')[0]] ?? []
}
