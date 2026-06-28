# Clippy Companion

A resurrected Clippy that appears on page load, reacts to navigation, delivers a
short contextual quip, and offers a small set of canned navigation buttons. He
talks *at* you, not *with* you — there is no chat input. Faithful to the
original: occasionally charming, easily dismissed.

Built on [`clippyjs`](https://github.com/pi0/clippyjs) (pi0's modern ESM rewrite).
The library bundles the agent sprite sheets and the classic sounds, so there is
nothing to self-host and no CDN dependency.

This doc has two parts:

1. **How to use it** — the high-level behaviour and what you can make him do.
2. **Technical implementation** — the frontend wiring, the SSG constraints, and
   how the Claude API back-end generates his quips.

---

## Part 1 — How to use it

### What Clippy can do

Everything below still works with **zero back-end** — if the API is down or has no
key, he falls back to hand-written quips. When the back-end is reachable, his lines
are *dynamically generated* by the Claude API instead (see Part 2); the behaviour is
otherwise identical.

| Capability  | What it looks like                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| **Talk**    | A speech balloon with a built-in word-by-word typewriter effect.                                             |
| **Animate** | A named animation (`Greeting`, `Wave`, `GetTechy`…) or a random one.                                         |
| **Idle**    | He cycles through idle fidgets on his own when not busy.                                                     |
| **Move**    | Walks across the screen to a coordinate.                                                                     |
| **Point**   | Gestures toward a coordinate — pair with a real element's position to point at your nav, a card, the footer. |
| **Sounds**  | Disabled. The MP3s ship with the package, but he's loaded muted (see Part 2).                                |
| **Dismiss** | Closed via an X on the widget; stays gone for good (`localStorage`). A footer button summons him back.       |

### How he behaves

- Appears on first load with a greeting animation + a welcome line — after the
  router is ready plus a short beat, so he "notices" the visitor rather than
  ambushing them. Respects `prefers-reduced-motion` (instant, no entrance).
- **Tablet+ only** — never loads on phones (smaller viewport dimension < 600px),
  where he'd be too space-hungry and blocking.
- On each scope change he plays a random gesture and speaks a quip for that scope
  (server-generated, or a hand-written fallback). Backing out of a modal is
  silent — see the route-reactive wiring in Part 2.
- About half his quips (`BUTTON_CHANCE`) arrive with a small button row inside the
  balloon: navigation links and the occasional "gag" button that plays an animation
  and delivers a one-off punchline. Every button row includes a Close button.
- Dismissed via an X on the widget; a `localStorage` flag keeps him **gone for
  good**. A footer button (paperclip + "Need a hand?") summons him back.
- Self-aware, slightly dry tone — fits the site's personality.

### Tone & UX principles (why this Clippy isn't annoying)

The original Clippy was hated for specific, well-documented reasons. None of them
are inevitable — they came from one root cause that **doesn't apply here**, plus a
handful of behaviours we can simply refuse to repeat.

**The root reframe.** The original interrupted people *trying to get work done* in a
productivity tool — adding cognitive load at the worst moment, breaking the basic
social norm that a colleague asks before interrupting. A portfolio site is not a
tool anyone is trying to finish a task in. Here Clippy **is** part of the
entertainment, not an obstacle to it. That's the whole licence to do this. The
only real risk is overstaying a welcome that was always just a novelty — so every
rule below serves "charming, brief, instantly dismissible."

**Hard rules — these are the antidote to the original's sins:**

| Original sin                            | Our rule                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reappeared after you dismissed him      | **"No" means gone.** One dismiss → gone for good (`localStorage`), with an explicit opt-in footer button to summon him back. This is the single most important feature, not a nice-to-have.                  |
| Interrupted focused work                | **Never block anything.** No modal, no covering content, no stealing focus, no animation that must finish before the visitor can act. He's a sidebar gag, not a gate.                                        |
| Knocked on the glass when you were idle | **Silence is the default.** Speak once per arrival, then idle quietly. Never re-trigger on the same page; never demand attention because the visitor went quiet.                                             |
| Same line every time, forever           | **Vary the lines.** ~10 quips per scope (Claude-generated, no-repeat queue) so a repeat visitor isn't hit with the identical string. Falls back to a couple of hand-written lines if the API is unavailable. |
| Unprompted escalation                   | **Earn the extra beat.** The button row is opt-in — nav links and gags only do something *if clicked*. He never escalates on his own. Consent-based, the inverse of the original.                            |
| "Leering" eyes felt like surveillance   | **Keep the gaze friendly.** Favour warm animations (`Greeting`, `Wave`, `Congratulate`); avoid the staring ones and don't have him track the cursor in a way that reads as "watching you."                   |
| Patronizing, oblivious                  | **Self-aware and ironic.** He *knows* he's Clippy and knows the bit is absurd. Self-awareness is the antidote to "patronizing."                                                                              |

**The comedic register.** The humour is *earnest help offered for absurdly
inappropriate things* — the "it looks like you're \[doing X]\, want help with that?"
formula deliberately misapplied. The classic dark-comedy version of this trope
offers chirpy assistance with things no assistant should help with; lean into that
ironic, slightly morbid mismatch between Clippy's relentless helpfulness and the
situation, kept tasteful enough for a professional portfolio. He's funny because he
commits completely to being helpful about the wrong thing.

### Example per-route lines

Illustrative of the register and the line+buttons shape. In the running site the
*line* comes from the Claude-generated pool (with a hand-written `LINES` fallback),
while the *buttons* are always defined on the frontend in `clippyActions.ts` — see
Part 2.

```text
Homepage:
  "It looks like you're visiting Peter's portfolio. Would you like to see his work?"
  [Show me]  [I'll look around]

Portfolio:
  "It looks like you're browsing projects. Peter has done some interesting AI
   tooling work recently."
  [Show me those]  [Back to home]

Articles:
  "It looks like you're looking for something to read. Peter has opinions about
   AI. Brace yourself."
  [Let's see]  [Maybe later]

Job History:
  "It looks like you're checking if Peter is employable. He is."
  [Back to portfolio]  [Contact him]
```

### Driving him from code

The agent is created once and then driven imperatively. Actions are **queued and
run in order**, so you can chain them:

```ts
agent.show()
agent.play('Greeting')
agent.speak("It looks like you're visiting Peter's portfolio. Need a hand?")
```

Make him point at a real element:

```ts
const rect = navEl.getBoundingClientRect()
agent.gestureAt(rect.left, rect.top)
```

Walk him somewhere, then talk:

```ts
agent.moveTo(window.innerWidth - 200, window.innerHeight - 200, 1000)
agent.speak('Down here when you need me.')
```

---

## Part 2 — Technical implementation

### Frontend

#### Component shape

```text
src/components/clippy/
  ClippyCompanion.vue    # Wrapper: phone gate, lazy-loads + creates the agent,
                         # owns the entrance/dismiss/navigation quips/gags, and
                         # renders the dismiss button.
  ClippyMessage.vue      # Action buttons teleported INTO the speech balloon.
src/composables/
  useClippy.ts           # Shared singleton state (dismissed / active / allowed).
  useClippyQuips.ts      # Per-scope quip pools: fetch once per session, serve
                         # with no immediate repeats (sessionStorage).
  clippyActions.ts       # Per-scope action-button config (frontend-only) + the
                         # ClippyAction discriminated union.
```

`ClippyCompanion.vue` handles startup, dismissal, **and** the route-reactive
behaviour: it gates on viewport size, lazy-loads the library after the router is
ready plus a beat, shows + greets + speaks a line for whatever scope the visitor
landed on, then speaks a fresh line on each scope change. It teleports a round
dismiss `X` into the agent's own element so it tracks the (draggable) widget.

`useClippy.ts` is a one-file singleton store (module-scoped refs) shared between
the companion and the footer's summon button — `dismissed` (persisted to
`localStorage`), `active` (on screen now), and `allowed` (client + non-phone, set
by the companion on mount). The footer reads `allowed`/`active` reactively to show
its summon button only where Clippy runs and only while he's hidden.

It is mounted once in `App.vue` as a sibling of `ModalOverlay` / `LoadingScreen`.

#### Loading the library

```ts
import { initAgent } from 'clippyjs'
import { Clippy } from 'clippyjs/agents'
// Other agents: Bonzi, F1, Genie, Genius, Links, Merlin, Peedy, Rocky, Rover

// Loaded muted: clippyjs has no mute API, so we override the sound loader with
// an empty map. Browsers block autoplay on load anyway — the only time audio
// fired was a user-triggered re-summon, which was jarring.
const agent = await initAgent({ ...Clippy, sound: () => Promise.resolve({ default: {} }) })
```

The library injects its own DOM into `<body>` and positions itself. The Vue
component renders one thing: a dismiss `X` button, `<Teleport>`ed into the agent's
own element (reached via its private `_el`) so it follows the widget when dragged
and hides with it.

#### SSG constraint (important)

The site is prerendered with **vite-ssg**. `clippyjs` touches `window` /
`document`, so it must never run during the server prerender.

Two rules:

1. Create the agent inside `onMounted` (which never runs server-side), **not** at
   module top level.
2. Use a **dynamic `import()`** so the browser-only library isn't even evaluated
   during the prerender (and stays out of the main bundle):

   ```ts
   onMounted(async () => {
     const { initAgent } = await import('clippyjs')
     const { Clippy } = await import('clippyjs/agents')
     const agent = await initAgent(Clippy)
     // …
   })
   ```

   A **type-only** import (`import type { initAgent } from 'clippyjs'`) is fine at
   the top level — it's erased at build time, so it has no runtime/SSR cost.

3. Always `agent.dispose()` in `onUnmounted` to remove his DOM.

#### Agent API reference

Confirmed from the installed type definitions:

| Method                      | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `show(fast?)`               | Show the agent (skip the entrance animation if `fast`).          |
| `hide(fast?, cb?)`          | Hide him.                                                        |
| `speak(text, hold?)`        | Show a balloon with the typewriter effect; `hold` keeps it open. |
| `play(name, timeout?, cb?)` | Play a named animation.                                          |
| `animate()`                 | Play a random non-idle animation.                                |
| `animations()`              | Return the list of animation names.                              |
| `hasAnimation(name)`        | Check a name exists before playing it.                           |
| `gestureAt(x, y)`           | Gesture toward a coordinate.                                     |
| `moveTo(x, y, duration)`    | Walk to a coordinate.                                            |
| `stopCurrent()` / `stop()`  | Stop the current action / clear the whole queue.                 |
| `pause()` / `resume()`      | Pause / resume animation.                                        |
| `dispose()`                 | Remove the agent from the DOM.                                   |

Clippy's full animation set (42 names), pulled from the installed agent data.
Call `agent.animations()` at runtime for the authoritative list.

| Group                   | Names                                                                                                                                                                                | Use?                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Expressive gestures** | `Wave`, `GetAttention`, `Congratulate`, `GetTechy`, `GetWizardy`, `GetArtsy`, `Searching`, `Thinking`, `Processing`, `Writing`, `Explain`, `CheckingSomething`, `Alert`, `Hearing_1` | ✅ Drive these on navigation / click.                                       |
| **Office-prop gags**    | `Print`, `SendMail`, `Save`, `EmptyTrash`                                                                                                                                            | ✅ Fine — Clippy-era flavour.                                               |
| **Entrance**            | `Greeting`                                                                                                                                                                           | ⚠️ Reserve for first load / re-summon — it reads as "appearing".            |
| **Pointing**            | `GestureUp`, `GestureDown`, `GestureLeft`, `GestureRight`                                                                                                                            | ⚠️ Only with `gestureAt()` toward a real element; aimless in a random pool. |
| **Looking**             | `LookUp`, `LookDown`, `LookLeft`, `LookRight` (+ 4 diagonals)                                                                                                                        | ❌ The "staring" set — feels like surveillance. Avoid.                      |
| **Idle loops**          | `Idle1_1`, `IdleAtom`, `IdleEyeBrowRaise`, `IdleFingerTap`, `IdleHeadScratch`, `IdleRopePile`, `IdleSideToSide`, `IdleSnooze`                                                        | ❌ Auto-played when the queue empties. Never drive manually.                |
| **Lifecycle**           | `Show`, `Hide`, `RestPose`, `GoodBye`                                                                                                                                                | ❌ System animations — `show()`/`hide()` invoke these for you.              |

The built-in `animate()` (and the double-click handler) picks at random from
**all** non-`Idle*` names — so it can surface the staring and lifecycle ones. For
a curated feel, keep an explicit allow-list and `play()` from that instead.

#### Behavioural notes (the non-obvious runtime facts)

These are things the type definitions don't tell you — confirmed by reading the
installed `clippyjs` source. Captured here so they don't have to be re-derived.

- **`hide()` with no `fast` plays a built-in `Hide` animation, *then* sets
  `display:none`** — but Clippy's `Hide` is only ~4 frames at `duration: 10`
  each (~40ms total, versus `duration: 100` for normal animations), so it reads
  as an instant vanish. `hide(true)` skips it and hides immediately. **There is
  no slow, graceful built-in exit.** A visible close animation would have to be
  our own (e.g. a CSS fade/sink on `_el`, then `hide(true)` to finalise) — and
  we deliberately chose *not* to build one; the instant hide is the shipped
  behaviour.
- **`play(name, timeout?, cb?)`'s callback fires on animation *exit*** (when the
  animation finishes / is interrupted), not on entry.
- **The library's method params are optional at runtime** even though the
  generated `.d.ts` marks several as required (`show(fast)`, `hide(fast, cb)`,
  `speak(text, hold)`). `ClippyCompanion.vue` declares its own `interface Agent`
  with the real optional signatures and casts to it — don't trust the bundled
  types.
- **`agent._el` is the agent's own `<div>`** (private, untyped). We `<Teleport>`
  the dismiss `X` into it so the button tracks the widget when dragged and hides
  with it. Reached via the cast `as unknown as Agent & { _el: HTMLElement }`.
- **`stop()` clears the whole queue** (and is what `hide()` calls internally), so
  you can't queue an animation *then* `hide()` and expect both to run — the
  `hide()` wipes the pending animation. Chain via `play(name, timeout, () =>
  agent.hide(true))` instead.
- **A *held* balloon (`speak(text, true)`) never fires clippyjs's queue-completion
  callback**, so the queue stays stuck and blocks every later `play()`/`speak()`.
  Because action buttons need the bubble to stay open, every button-bearing quip
  is held — and must be released explicitly: `_balloon.close()` (fires the
  completion, unsticking the queue) **+** clear `_balloon._hold` (which `close()`
  leaves set) **+** `_balloon.hide(true)` (collapse it now). `closeBubble()` does
  all three. This is why a stray held bubble silently kills Clippy for the rest of
  the session.
- **`stop()`'s non-fast hide schedules a *delayed* `_finishHideBalloon`.** On fast
  navigation that stale timer fires into the *next* quip's bubble, closing a held
  one and wedging `_hold=true`. Call `_balloon.pause()` (cancels the pending
  timers) right after `stop()` before speaking again.
- **clippyjs defers `play()`/`show()`/`hide()` behind an idle "exit" promise** so a
  running idle finishes its wake-up branch first — but idles with no exit branch
  never resolve it and **deadlock every later action**. `firstShow()` patches
  `_playInternal` to trigger the idle's exit and race its completion against a
  short grace window (`IDLE_EXIT_GRACE_MS`), then swaps in the requested animation.
- **Two ways to speak, picked by timing.** A *navigation* quip speaks straight on
  the balloon (`_balloon.speak`) so the bubble appears **alongside** the gesture;
  `Agent.speak` would queue behind the `play()` and the bubble would lag the
  animation. The *entrance / re-summon* quip instead uses `_addToQueue` so the
  bubble waits for the show animation to drain. `say(…, concurrent)` chooses.
- **A busy bubble is left standing, not interrupted.** If a bubble is mid-write
  (`_balloon._active`) or holding buttons (`_hold`), a new navigation quip is
  skipped — clippyjs has no clean mid-write abort, so stacking/interrupting looks
  worse than just letting the current line finish. Button clicks close it explicitly.
- **Action buttons widen the balloon, so the text has to be re-fitted.** `speak()`
  pins the text column to its own ≤200px width; once the wider button `<menu>`
  teleports in as a sibling, the text looks cramped in a now-wide bubble.
  `fitContentToButtons` re-pins the text to the inner balloon width (re-measuring
  height too, since fewer wrap lines need less height) and repositions. This is the
  one piece of "theming" work the balloon needed beyond CSS.

#### Route-reactive wiring

A `watch` on `route.path` drives the agent. The path is reduced to a **scope** —
`scopeOf(path)` strips the leading `/` and maps `''` to `'home'`, so the top-level
scopes are `home`, `portfolio`, `articles`, `job-history`, and item routes become
`{type}/{slug}` (e.g. `portfolio/job-scout`).

The watcher **skips modal-close transitions** — when `prev` was an item scope
(`includes('/')`) and the new scope is a top-level one, the visitor is just backing
out of a modal, not arriving somewhere new, so Clippy stays quiet.

`quipFor(scope)` resolves the line: the **server pool first** (`nextQuip(scope)`
from `useClippyQuips`, drained from the per-session sessionStorage queue), falling
back to a hand-written `LINES[section]` entry when the pool is empty or the fetch
failed. A gesture is chosen from a curated `GESTURES` list via `randomGesture`
(no immediate repeat), and the line is held open (`speak(text, true)`) when it
carries action buttons. `readingDelay(text)` (≈ 280 ms/word, clamped 2.5–9 s)
decides how long a button-less line stays up before auto-closing.

#### Buttons

The action buttons are our own Vue DOM (`ClippyMessage.vue`), but they are
**`<Teleport>`-ed *into* the library balloon element** — not floated beside the
agent — so they sit inside the speech bubble and move/close with it. The button
set comes from `clippyActions.ts`: `actionsFor(scope)` returns a per-scope list
(`ClippyAction = NavButton | GagButton`, a discriminated union), looked up by exact
scope then by section prefix. This is **frontend config, never returned by the
API**. Nav buttons are `<RouterLink>`s; a Close button is always present; gag
buttons emit a key that `ClippyCompanion` maps to a `GAGS` entry (play an animation -
speak a canned line). A quip carries buttons with probability `BUTTON_CHANCE`
(0.5).

#### Startup, dismiss & summon

- **Startup** waits on `router.isReady()`, then a fixed beat
  (`FIRST_SHOW_DELAY_MS`), then lazy-loads the library. `LoadingScreen` uses the
  same "router ready + fixed delay" gate, so the two are consistent.
- **Phone gate:** on mount, `allowed = Math.min(innerWidth, innerHeight) >= 600`.
  Phones bail before anything loads; tablets+ proceed.
- **Dismiss** is persistent. A `localStorage` flag (`clippy-dismissed`) is read
  when `useClippy` initialises and set when the visitor clicks the dismiss `X`.
  Once set, he stays hidden across visits — *gone means gone*.
- **Summon** (footer button) clears the flag. A `watch` on `dismissed` drives the
  agent: hide when dismissed, first-show once, re-show on later summons (he's
  hidden, not disposed, so re-showing is instant).

#### Theming the balloon

The library's **default balloon (classic Office Assistant yellow) was kept as-is** —
it fits the retro-Clippy bit better than restyling it to the site's aesthetic would.
The only styling needed was the **in-bubble buttons** (`ClippyMessage.vue`'s scoped
CSS: flat thin-bordered dialog boxes on the `#ffc` yellow, under a separator rule),
plus the JS width-fix above (`fitContentToButtons`) so the text fills a button-widened
bubble. The buttons are teleported into the balloon, so their styles live in
`ClippyMessage.vue` rather than a global override.

---

### Back-end (Claude API) — pre-generated quip pools

The back-end turns a **scope** into a *pool* of ready-made quips, not a single
line per request. Claude is called **at most once per scope per TTL window**,
server-side, and the result is cached to a flat JSON file shared by every visitor.
The browser fetches a scope's pool once per session and serves lines from it
locally — so normal browsing makes **no Anthropic calls at all**.

#### Why a back-end at all

The site is a **public SPA** — anything in its JavaScript is readable by anyone.
The Anthropic API key must therefore **never** ship to the browser. The Slim 4 API
proxies the call: the frontend only ever talks to our own endpoint, and the key
lives in `api/.env`.

#### Flow

```text
ClippyCompanion ──fetch──▶  GET /api/clippy/quips/portfolio
   (Vue, once/session)            │
                                  ▼
                          ClippyHandler (Slim)
                                  │
                                  ▼
                          ClippyService::getPool(scope)
                                  │
                   ┌──────────────┴────────────────┐
                   │ cache file fresh (< TTL)?     │
                   │   yes → return cached quips   │
                   │   no  → call Anthropic, cache │
                   └──────────────┬────────────────┘
                                  ▼
                          { "quips": ["…", "…", …] }   (~10 lines)
   sessionStorage queue ◀─────────┘
   nextQuip(scope) drains it locally, no further calls
```

#### Endpoint contract

```text
GET /api/clippy/quips/{scope}

200 OK
{ "quips": ["It looks like you're browsing projects…", … ] }   (~10 lines)

Cache-Control: no-store   (the server-side file cache is the cache; the
                           browser dedups per session, so don't double-cache)
```

An **invalid scope or any failure returns `{ "quips": [] }`** (HTTP 200) — Clippy
degrades gracefully to the frontend `LINES` fallback rather than erroring.

#### Handler / service responsibilities

`ClippyHandler.php` is thin: read `{scope}`, call `ClippyService::getPool`, write
`{ quips }` with `Cache-Control: no-store`. The work lives in `ClippyService.php`:

- **`isValidScope`** — a trust boundary. The scope is checked against the known
  allow-list (top-level sections + `{type}/{slug}` where type ∈ `portfolio`,
  `articles`), slug matched against `/^[a-z0-9-]+$/`, and confirmed to exist on
  disk. Arbitrary strings never reach the prompt.
- **`getPool` → `readFresh`** — the cache file (`/` in the scope becomes `__` in
  the filename) is served when its `filemtime` is within `ttlSeconds`; otherwise
  `generate` is called and the result re-cached.
- **`generate`** — a plain cURL `POST` to `api.anthropic.com/v1/messages`
  (`max_tokens` 1024). The `SYSTEM` constant carries the Clippy persona;
  `buildPrompt` asks for *"10 distinct one-liners"* for the scope, pulling page
  context via `ContentService`. `parseQuips` extracts the first `[…]` JSON array.
  Returns `[]` if the API key is empty — no key, no calls, frontend falls back.

#### Calling Anthropic from PHP

Plain cURL, not the SDK — one POST per scope per TTL is not worth a dependency.

Config in `api/.env` (gitignored):

```text
ANTHROPIC_API_KEY=sk-ant-…
CLIPPY_MODEL=claude-haiku-4-5
```

**Model choice:** short quips want low latency and cost, so Haiku 4.5 is the
default. Bump `CLIPPY_MODEL` to a Sonnet/Opus model for more wit — a single env
change. TTL and cache dir are likewise constructor config.

#### Per-session frontend cache (`useClippyQuips.ts`)

The browser fetches each scope's pool **once per session** and stores it in
`sessionStorage` (`clippy-pool:{scope}`). `nextQuip(scope)` serves from a shuffled,
no-repeat queue (`clippy-queue:{scope}`, Fisher–Yates, reshuffled only when
drained) so the same line doesn't recur back-to-back within a session. A failed or
empty fetch is **not** cached, so a later navigation can recover.

#### No streaming

`clippyjs`'s `speak()` is one-shot and animates text word-by-word itself, and the
quips are pre-generated anyway — there is **no streaming** and nothing to stream.
The pool is fetched as a whole; the library's typewriter does the rest.

#### Failure handling

If the API call fails, the key is missing, or the scope is invalid, the endpoint
returns an empty pool and the frontend falls back to the hard-coded `LINES[section]`
entry. Clippy is never silent or broken when the back-end is unavailable — the API
only *upgrades* the lines when it succeeds.

---

## Status

- ✅ Library installed; `ClippyCompanion.vue` mounted.
- ✅ Startup: router-ready + fixed beat, greeting + welcome line, reduced-motion path.
- ✅ Phone gate (tablet+ only).
- ✅ Sound off (empty sound map).
- ✅ Persistent dismiss (`localStorage`, gone-means-gone) + teleported dismiss `X`.
- ✅ Footer summon button (`useClippy` shared state).
- ✅ Route-reactive quips + per-scope animation (scope watcher, modal-close skip).
- ✅ Action buttons teleported into the balloon (`ClippyMessage.vue`, `clippyActions.ts`).
- ✅ Claude API back-end: pre-generated quip pools, file cache + TTL
  (`ClippyHandler` + `ClippyService`, `GET /api/clippy/quips/{scope}`).
- ✅ Per-session frontend pool cache + no-repeat queue (`useClippyQuips.ts`).
- ✅ Balloon: default theme kept; in-bubble button CSS + text width-fit (`ClippyMessage.vue`, `fitContentToButtons`).
