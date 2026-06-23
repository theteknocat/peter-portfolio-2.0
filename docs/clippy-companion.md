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
| **Sounds**  | The classic Clippy MP3s ship with the package.                                                               |
| **Dismiss** | Closed by the visitor and stays gone for the session.                                                        |

### The behaviour we're building

- Appears on first load with a greeting animation + a welcome line.
- On route change, plays a fitting animation and speaks a **canned line for that page**.
- Offers **2–4 canned buttons** under the balloon (navigation links, "dismiss",
  maybe a "tell me more" that fires a second scripted line).
- Can be dismissed; a `localStorage` flag keeps him gone for the rest of the session.
- Self-aware, slightly dry tone — fits the site's personality.

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
  ClippyCompanion.vue    # Wrapper: creates the agent, owns show/hide/session state,
                         # watches the route, picks the line + animation per page.
  ClippyMessage.vue      # The canned action buttons (the library balloon is text-only).
```

Currently only `ClippyCompanion.vue` exists, in a minimal "stand-up" form: it
loads the agent, shows it, and speaks one line. Route-awareness, buttons, dismiss
state, and theming are the work still to do.

It is mounted once in `App.vue` as a sibling of `ModalOverlay` / `LoadingScreen`.

#### Loading the library

```ts
import { initAgent } from 'clippyjs'
import { Clippy } from 'clippyjs/agents'
// Other agents: Bonzi, F1, Genie, Genius, Links, Merlin, Peedy, Rocky, Rover

const agent = await initAgent(Clippy)
```

The library injects its own DOM into `<body>` and positions itself — the Vue
component renders nothing into the template.

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

Clippy's animation names include: `Greeting`, `Wave`, `GetAttention`,
`Congratulate`, `GetTechy`, `GetWizardy`, `GetArtsy`, `Searching`, `Thinking`,
`Processing`, `Writing`, `Print`, `SendMail`, `Save`, `GestureUp/Down/Left/Right`,
`LookUp/Down/Left/Right` (+ diagonals), and several `Idle*` fidgets. Call
`agent.animations()` at runtime for the authoritative list.

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

#### Dismiss + session memory

A `localStorage` flag (e.g. `clippy-dismissed`) checked on mount; if set, skip
creating the agent entirely. Set it when the visitor closes him.

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

- ✅ Library installed, minimal `ClippyCompanion.vue` mounted and shows on load.
- ⬜ Route-reactive canned lines + per-page animation.
- ⬜ Action buttons (`ClippyMessage.vue`).
- ⬜ Dismiss-for-session (`localStorage`).
- ⬜ Balloon theming.
- ⬜ Claude API back-end (`ClippyHandler` + `/api/clippy`).
