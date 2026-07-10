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

/** Every gag button, so a scope without its own nav can draw a second one at random. */
const GAG_BUTTONS: GagButton[] = [
  { kind: 'gag', label: 'Enhance', gag: 'enhance' },
  { kind: 'gag', label: 'Print to fax', gag: 'print' },
  { kind: 'gag', label: 'Summarize in Clippy', gag: 'summarize' },
  { kind: 'gag', label: 'Format as WordArt', gag: 'wordart' },
]

/** Each scope's guaranteed gag, plus optional nav destination(s) to pick from. */
const SCOPES: Record<string, { gag: string; navs?: NavButton[] }> = {
  home: {
    gag: 'enhance',
    navs: [
      { kind: 'nav', label: 'See his projects', to: '/portfolio' },
      { kind: 'nav', label: 'Read his ramblings', to: '/articles' },
    ],
  },
  portfolio: { gag: 'print' },
  articles: {
    gag: 'summarize',
    navs: [{ kind: 'nav', label: 'Show me his work', to: '/portfolio' }],
  },
  experience: {
    gag: 'wordart',
    navs: [{ kind: 'nav', label: 'See the proof', to: '/portfolio' }],
  },
}

/**
 * Resolve the action set for a scope, falling back to the section's set for
 * item scopes ({type}/{slug}). Always 2 buttons: the scope's own gag, plus a
 * random nav (if the scope has one) or a second, distinct random gag.
 *
 * @param scope - The current quip scope (e.g. 'home', 'portfolio/some-slug').
 * @returns The buttons for that scope, or an empty array if none are defined.
 */
export function actionsFor(scope: string): ClippyAction[] {
  const cfg = SCOPES[scope] ?? SCOPES[scope.split('/')[0]]
  if (!cfg) return []
  const ownGag = GAG_BUTTONS.find((g) => g.gag === cfg.gag)!
  const otherGags = GAG_BUTTONS.filter((g) => g.gag !== cfg.gag)
  const pool: ClippyAction[] = cfg.navs?.length ? cfg.navs : otherGags
  const second = pool[Math.floor(Math.random() * pool.length)]
  return [ownGag, second]
}
