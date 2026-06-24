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
   how the optional Claude API back-end is set up.

---

## Part 1 — How to use it

### What Clippy can do (frontend only, no back-end)

Everything below works with **zero back-end**. The only thing the Claude API adds
later is *dynamically generated* quips instead of hand-written ones (see Part 2).

| Capability  | What it looks like                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| **Talk**    | A speech balloon with a built-in word-by-word typewriter effect.                                             |
| **Animate** | A named animation (`Greeting`, `Wave`, `GetTechy`…) or a random one.                                         |
| **Idle**    | He cycles through idle fidgets on his own when not busy.                                                     |
| **Move**    | Walks across the screen to a coordinate.                                                                     |
| **Point**   | Gestures toward a coordinate — pair with a real element's position to point at your nav, a card, the footer. |
| **Sounds**  | Disabled. The MP3s ship with the package, but he's loaded muted (see Part 2).                                |
| **Dismiss** | Closed via an X on the widget; stays gone for good (`localStorage`). A footer button summons him back.       |

### The behaviour we're building

- Appears on first load with a greeting animation + a welcome line — after the
  router is ready plus a short beat, so he "notices" the visitor rather than
  ambushing them. Respects `prefers-reduced-motion` (instant, no entrance).
- **Tablet+ only** — never loads on phones (smaller viewport dimension < 600px),
  where he'd be too space-hungry and blocking.
- *(Planned)* On route change, plays a fitting animation and speaks a **canned
  line for that page**.
- *(Planned)* Offers **2–4 canned buttons** under the balloon (navigation links,
  maybe a "tell me more" that fires a second scripted line).
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

| Original sin                            | Our rule                                                                                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reappeared after you dismissed him      | **"No" means gone.** One dismiss → gone for good (`localStorage`), with an explicit opt-in footer button to summon him back. This is the single most important feature, not a nice-to-have. |
| Interrupted focused work                | **Never block anything.** No modal, no covering content, no stealing focus, no animation that must finish before the visitor can act. He's a sidebar gag, not a gate.                       |
| Knocked on the glass when you were idle | **Silence is the default.** Speak once per arrival, then idle quietly. Never re-trigger on the same page; never demand attention because the visitor went quiet.                            |
| Same line every time, forever           | **Vary the lines.** 2–3 rotating quips per route so a repeat visitor isn't hit with the identical string. (This is also what the Claude API buys later.)                                    |
| Unprompted escalation                   | **Earn the second line.** "Tell me more" is opt-in — he expands *only* if asked. Consent-based, the inverse of the original.                                                                |
| "Leering" eyes felt like surveillance   | **Keep the gaze friendly.** Favour warm animations (`Greeting`, `Wave`, `Congratulate`); avoid the staring ones and don't have him track the cursor in a way that reads as "watching you."  |
| Patronizing, oblivious                  | **Self-aware and ironic.** He *knows* he's Clippy and knows the bit is absurd. Self-awareness is the antidote to "patronizing."                                                             |

**The comedic register.** The humour is *earnest help offered for absurdly
inappropriate things* — the "it looks like you're \[doing X]\, want help with that?"
formula deliberately misapplied. The classic dark-comedy version of this trope
offers chirpy assistance with things no assistant should help with; lean into that
ironic, slightly morbid mismatch between Clippy's relentless helpfulness and the
situation, kept tasteful enough for a professional portfolio. He's funny because he
commits completely to being helpful about the wrong thing.

### Example per-route lines

These are hand-written and live in a config object on the frontend. The Claude
API (Part 2) can later replace the *line* while the buttons stay defined here.

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
                         # owns the entrance/dismiss, renders the dismiss button.
  ClippyMessage.vue      # (Planned) canned action buttons (the balloon is text-only).
src/composables/
  useClippy.ts           # Shared singleton state (dismissed / active / allowed).
```

`ClippyCompanion.vue` handles startup and dismissal: it gates on viewport size,
lazy-loads the library after the router is ready plus a beat, shows + greets +
speaks one welcome line, and teleports a round dismiss `X` into the agent's own
element so it tracks the (draggable) widget. Route-awareness, action buttons, and
balloon theming are the work still to do.

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

| Group | Names | Use? |
| --- | --- | --- |
| **Expressive gestures** | `Wave`, `GetAttention`, `Congratulate`, `GetTechy`, `GetWizardy`, `GetArtsy`, `Searching`, `Thinking`, `Processing`, `Writing`, `Explain`, `CheckingSomething`, `Alert`, `Hearing_1` | ✅ Drive these on navigation / click. |
| **Office-prop gags** | `Print`, `SendMail`, `Save`, `EmptyTrash` | ✅ Fine — Clippy-era flavour. |
| **Entrance** | `Greeting` | ⚠️ Reserve for first load / re-summon — it reads as "appearing". |
| **Pointing** | `GestureUp`, `GestureDown`, `GestureLeft`, `GestureRight` | ⚠️ Only with `gestureAt()` toward a real element; aimless in a random pool. |
| **Looking** | `LookUp`, `LookDown`, `LookLeft`, `LookRight` (+ 4 diagonals) | ❌ The "staring" set — feels like surveillance. Avoid. |
| **Idle loops** | `Idle1_1`, `IdleAtom`, `IdleEyeBrowRaise`, `IdleFingerTap`, `IdleHeadScratch`, `IdleRopePile`, `IdleSideToSide`, `IdleSnooze` | ❌ Auto-played when the queue empties. Never drive manually. |
| **Lifecycle** | `Show`, `Hide`, `RestPose`, `GoodBye` | ❌ System animations — `show()`/`hide()` invoke these for you. |

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

#### Route-reactive pattern (sketch)

```ts
const lines: Record<string, { text: string; anim: string }> = {
  '/':            { text: '…',  anim: 'Greeting' },
  '/portfolio':   { text: '…',  anim: 'GetTechy' },
  '/articles':    { text: '…',  anim: 'GetArtsy' },
  '/job-history': { text: '…',  anim: 'LookRight' },
}

watch(() => route.path, (path) => {
  const line = lines[path]
  if (!line || dismissed.value) return
  agent.value?.play(line.anim)
  agent.value?.speak(line.text)
})
```

#### Buttons

The library balloon is **text only** — the action buttons are our own Vue DOM
(`ClippyMessage.vue`), positioned next to the agent using its bounding rect. The
button set is defined per-route in the frontend config, **not** returned by any
API.

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

The balloon DOM uses the library's own classes (`.clippy-balloon`, etc.). Restyle
it with **global, unlayered** CSS (it's third-party DOM outside any component
scope) to match the cyberpunk art-deco aesthetic.

---

### Back-end (Claude API) — optional, swaps in later

The back-end's only job is to turn "which page is the visitor on" into a generated
quip. Everything else (buttons, animations, dismiss) stays on the frontend.

#### Why a back-end at all

The site is a **public SPA** — anything in its JavaScript is readable by anyone.
The Anthropic API key must therefore **never** ship to the browser. The existing
Slim 4 API proxies the call: the frontend only ever talks to our own endpoint,
and the key lives in `api/.env`.

#### Flow

```text
ClippyCompanion ──fetch──▶  GET /api/clippy?page=portfolio
   (Vue)                          │
                                  ▼
                          ClippyHandler (Slim)
                                  │  builds prompt from page context
                                  ▼
                          Anthropic Messages API   (key from api/.env)
                                  │
                                  ▼
                          { "text": "…the quip…" }
   agent.speak(text)  ◀───────────┘
```

#### Endpoint contract

```text
GET /api/clippy?page={page}

200 OK
{ "text": "It looks like you're browsing projects…" }
```

Keep it a thin request: the handler already knows the canned button set lives on
the frontend, so it returns **only** the line. Page content can be passed for
richer quips, but start with just the page name.

#### Handler responsibilities (`api/src/Handlers/ClippyHandler.php`)

Following the existing handler/service conventions:

- Read the `page` query param; validate it against a known allow-list of routes
  (a trust boundary — don't forward arbitrary strings into a prompt).
- Build the prompt:
  - **System prompt** — establishes the Clippy persona (dry, self-aware, ≤ 2
    sentences, no markdown, in character).
  - **User message** — the page name, optionally a short summary of that page's
    content pulled via the existing `ContentService` / `PageLayoutService`.
- Call the Anthropic Messages API and return `{ text }`.

#### Calling Anthropic from PHP

Two options:

```text
- Official SDK:  composer require anthropic-ai/sdk   (typed client)
- Plain HTTP:    a few lines of Guzzle/cURL against the Messages endpoint
```

Given the request is a single short message, the plain-HTTP path is the lazy
default; reach for the SDK only if the integration grows.

Config in `api/.env` (gitignored):

```text
ANTHROPIC_API_KEY=sk-ant-…
CLIPPY_MODEL=claude-haiku-4-5
```

**Model choice:** a one-line quip wants low latency and low cost, so Haiku 4.5 is
the sensible default. Bump `CLIPPY_MODEL` to a Sonnet/Opus model if the quips need
more wit — it's a single env change.

#### No streaming

`clippyjs`'s `speak()` is one-shot and already animates text word-by-word itself,
so there is **no value in streaming tokens** from Claude into the balloon —
doing so would mean chunking into repeated `speak()` calls that fight the
library's own queue. The endpoint returns the full line; the library's typewriter
does the rest. (The original plan's streaming idea relied on a different library's
`speakStream()`, which pi0's `clippyjs` does not have.)

#### Failure handling

If the API call fails or times out, fall back to the **canned line** for that
route. The frontend should always have a hard-coded line per page so Clippy is
never silent or broken when the back-end is unavailable — the API only *upgrades*
the line when it succeeds.

---

## Status

- ✅ Library installed; `ClippyCompanion.vue` mounted.
- ✅ Startup: router-ready + fixed beat, greeting + welcome line, reduced-motion path.
- ✅ Phone gate (tablet+ only).
- ✅ Sound off (empty sound map).
- ✅ Persistent dismiss (`localStorage`, gone-means-gone) + teleported dismiss `X`.
- ✅ Footer summon button (`useClippy` shared state).
- ⬜ Route-reactive canned lines + per-page animation.
- ⬜ Action buttons (`ClippyMessage.vue`).
- ⬜ Balloon theming.
- ⬜ Claude API back-end (`ClippyHandler` + `/api/clippy`).
