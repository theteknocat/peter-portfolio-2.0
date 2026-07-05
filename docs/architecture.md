# Portfolio Site — Architecture & Reference

Long-term reference for the structure, key concepts, and design decisions behind
this site. `CLAUDE.md` covers the same ground more tersely and is always in the
assistant's chat context; this document is *not* loaded into context, so it
deliberately retains the fuller explanations and rationale for future reference.

---

## Current State (as of 2026-06-28)

The site is built and functionally complete:

- **Frontend SPA** — all four pages (home, portfolio, articles, experience)
  render live content from the API. Portfolio and article detail views work as
  routed modal overlays. The full cyberpunk art-deco visual system is in place,
  including the animated background tile, glitch-spot overlay, and
  lightning-streak overlay.
- **Slim API** — three endpoints serving flat-file content (see § API).
- **SEO / SSG** — `vite-ssg` prerenders each static route; per-route metadata via
  the `useSeo` composable; `robots.txt` and a build-time `sitemap.xml`.
- **Clippy companion** — AI-driven backend + frontend (see `clippy-companion.md`).
- **Deploy** — local build, rsync artifact to an nginx + PHP-FPM server (Option B).

**Deferred / future** (not built — see § Future & Deferred): multi-column
layouts, the multi-markdown-field sigil, SSR-fetching home content, detail-page
prerendering, bot/LLM mitigation, the Konami easter egg.

---

## Overview & Goals

A headless portfolio: a Vue 3 SPA consuming a lightweight Slim 4 PHP API. Content
is flat YAML/Markdown files **outside the repository**, synced locally and to the
server via rsync. The public GitHub repo demonstrates the full stack while keeping
content separate and privately managed.

Goals: demonstrate Vue 3 / TypeScript / Vite architecture and clean Slim API
design; preserve the existing cyberpunk art-deco aesthetic with better UX; make
content trivial to add without touching code; surface portfolio work and articles
from the homepage; give employers a public repo to browse.

---

## Stack

**Frontend** (`frontend/package.json`): Vue 3 (Composition API), TypeScript, Vite,
Vue Router, Tailwind CSS 4. `marked` for Markdown rendering, `highlight.js` for
code blocks, `js-yaml` where client-side YAML is needed. `simple-icons` (tech
badges) + `@lucide/vue` (UI icons). `@floating-ui/dom` for tooltips. `vite-ssg`
for prerender; `@unhead/vue` (pinned `^2`) for head tags. `clippyjs` for Clippy.

**Backend** (`api/composer.json`): Slim 4 (PHP 8.3), PHP-DI, `symfony/yaml`,
`phpdotenv`. Flat-file content layer — no database.

**Dev env:** DDEV (no database container). See `CLAUDE.md` § Key Commands.

---

## Content Model

Content lives outside the repo at a configurable path (`CONTENT_PATH` in
`api/.env`), mirrored locally and rsynced to the server. Three layers:

- **Page layout** (`api/layouts/{page}.yaml`, **checked into the repo**) — defines
  a page's *structure*: which sections exist, their type, which manifest or content
  source each draws from, and query params (`limit`, `filter`). Changing structure
  needs a code commit + deploy.
- **Manifest** (`content/manifests/{name}.yaml`, **outside repo**) — an ordered
  list of content slugs (with per-item flags like `featured`). Controls which
  items appear and in what order. Reordering/adding is rsync-only, no code change.
- **Content** (`content/{type}/{slug}.yaml` or `.md`, **outside repo**) — the
  individual items manifests reference. Also rsync-only to update.

```text
page layout → names a manifest + params (limit, filter)
  → manifest → ordered list of slugs
    → content files → resolved item data
      → embedded in the section response
```

**Field schemas are not duplicated here** — they change, and the source of truth
is the TypeScript interfaces in `frontend/src/types/` (`portfolio.ts`, `article.ts`,
`experience.ts`, `page.ts`) plus the authoring templates in `docs/templates/` and
`docs/content-cheat-sheet.md`. As of this writing a portfolio item uses
`title` / `summary` / `tags` (each `{ label, si?, lucide? }`) / `url` / `featured`
/ `images` (each `{ src, alt }`) / `body`.

---

## API

All responses are `application/json`; Markdown is returned as raw strings for
client-side rendering. Manifests are resolved **server-side** — the frontend never
fetches them directly. Routes (`api/src/routes.php`):

```text
GET /api/page/{page}
  Fully resolved page: layout structure with all manifest items and content
  already fetched and embedded. One request per page view.

GET /api/content/{type}/{slug}
  A single content item by type and slug (portfolio | article | experience).
  Used by the modal/detail views.

GET /api/clippy/quips/{scope}
  Clippy's contextual lines for a page scope (see clippy-companion.md).
```

Handlers in `api/src/Handlers/`, business logic in `api/src/Services/`
(`ContentService` reads/parses files; `ManifestService` resolves slugs).
`CorsMiddleware` handles cross-origin headers in dev.

---

## Navigation & Transitions

### Two-level routing

Top-level pages render into the default `<RouterView>`. Detail routes are nested
children rendered into a **named `modal` view**, so the parent listing stays
visible behind the overlay:

```text
/                  → { default: HomeView }
/portfolio         → { default: PortfolioView }
/portfolio/:slug   → { default: PortfolioView, modal: PortfolioItemView }
/articles/:slug    → { default: ArticlesView,  modal: ArticleView }
```

`meta.modal: true` flags modal routes. Navigating directly to a detail URL still
shows the parent listing behind, because the parent is the route's `default`
component — no special-casing needed.

### How the modal overlay works (`App.vue` + `ModalOverlay.vue`)

- While a modal is open, `App.vue` **freezes the background page**: it snapshots
  the non-modal path as the `<Transition>` key (`pageKey`) and captures the
  previously-active route component in a `shallowRef` (`frozenComponent`) so the
  page behind doesn't switch to the modal route's default component when opening a
  modal from a different page. (See the in-file comment for why the render-time
  write is safe.)
- `.page-scene` holds the 3D perspective; `.page-layer` is what transforms. On
  modal open the page-layer **recedes** — `transform: scale(0.92)` plus a
  `clip-path` inset that pins the visible region to the current scroll position
  (`--page-scroll-y`, captured on open).
- `ModalOverlay.vue` provides the full-viewport backdrop, scroll lock
  (`body.modal-open`), a focus trap, and close via button / backdrop click /
  Escape. The panel scales in only after the inner view signals content is ready
  (`provide('signalModalReady')`), so the backdrop + spinner appear instantly but
  the panel doesn't animate over a loading state.

### Background animation interaction — hide the tile, don't pause it

When a detail modal opens, `body.modal-open .bg-layer { background-image: none }`
(in `background.css`) **hides** the scrolling background tile for the duration the
modal is open. This noticeably smooths the modal open animation — compositing the
animated tile behind the simultaneous page-recede (`.page-layer` scale) and panel
scale-in was causing a visible judder, at least in Firefox.

**Why hide, not pause:** the `bg-scroll` keyframe keeps running the whole time.
The streak and glitch-spot overlays calculate their positions in JS against the
background's *running* offset (`useBackgroundStreaks.ts` derives drift from elapsed
time, not from the CSS animation state). Pausing only `.bg-layer` would desync it
from those overlays; pausing everything in sync is fragile because the streaks are
driven by independent rAF loops. Hiding the image sidesteps all of it — the tile
animation is never interrupted, so when `background-image` is restored on close it
is already at the correct position to line back up with the streaks and spots.

The related transition timings (modal panel scale, `.page-layer` recede/return,
and the `0.65s` streak/spot visibility-restore delay in `App.vue`) are tuned
together — if you change the page-layer return duration, revisit that delay.

---

## SEO & SSG

The site is a client-side SPA, so crawlers would get a near-empty `index.html`
until JS runs. `vite-ssg` fixes this by prerendering each route to a real HTML file
at build time.

- `main.ts` exports a `ViteSSG(App, { routes }, setupFn)` factory; routes are
  exported from `router/index.ts`.
- Output is **flat** HTML per static route (`dist/portfolio.html`, *not*
  `dist/portfolio/index.html`) — matters for the nginx `try_files` rule.
- Static HTML carries the full `<head>` + chrome + a `Loading…` placeholder.
  **Page/item body content is fetched at runtime** (`onMounted`), so it hydrates
  client-side rather than being baked. Deliberate: name searches surface via the
  homepage + per-page metadata, and there's little value in baking body content.
- **Versions:** `vite-ssg` `^28` with `@unhead/vue` `^2` (must match the copy
  vite-ssg bundles — a v3 mismatch silently breaks head tags). Build command is
  `vue-tsc && vite-ssg build`; plain `vite build` does **not** prerender.
- **Per-route metadata:** `useSeo` (`composables/useSeo.ts`) wraps `useHead` and
  emits `<title>`, description, canonical, and Open Graph + Twitter tags. `og:image`
  is omitted until a share-card image exists; no JSON-LD yet.
- `robots.txt` is static in `frontend/public/`; `sitemap.xml` is generated by
  `ssgOptions.onFinished` in `vite.config.ts`, which walks `dist/` for `.html`
  files — new prerendered routes appear automatically.

**Trade-off vs Nuxt 3:** Nuxt is more mature but needs an architectural migration;
`vite-ssg` is the right call while still establishing Vue 3 / TS patterns. Revisit
a Nuxt migration only if the site outgrows this.

---

## Build & Deploy (Option B)

The generated static HTML is a **build artifact, not source** — `vite-ssg` outputs
to the gitignored `frontend/dist/`, never committed. Build locally, ship the
artifact; the server runs nginx + PHP-FPM only (**no Node, no server-side build**).

```text
Build (local):  npm run build  →  dist/ (HTML + hashed assets + robots.txt + sitemap.xml)
                No API needed at build — content is fetched at runtime, not baked.

Deploy:
  - rsync dist/    → nginx web root
  - rsync content/ → server CONTENT_PATH (read by the PHP API at runtime)
  - API code: git pull + composer install on the server

nginx:  try_files $uri $uri.html /index.html;   # flat .html: /portfolio → portfolio.html
        /api/* → PHP-FPM
```

**Content-only changes go live by rsync alone** — the API reads fresh files at
runtime. A rebuild is only needed for frontend code or SEO-copy edits (the only
things baked into static HTML). Code and content deploys are fully independent.

---

## Future & Deferred

Design notes for work intentionally not built yet.

### Layout & content

- **Multi-column layouts:** a section `type: two-column` with a `columns` array of
  child sections. Backend `resolveSection()` recurses into `columns`; the frontend
  component receives pre-resolved children and renders them side by side via the
  same dynamic component lookup. Same pattern, one level deeper.
- **Multiple markdown fields:** an `@` sigil in a YAML value to reference a
  separate file — e.g. `intro: "@my-project-intro"` would load
  `content/portfolio/my-project-intro.md` and substitute its contents. The current
  single `.md` body convention covers all known cases.
- **Portfolio card key-image + hover reveal:** an optional `key_image` field (a
  hand-cropped, hand-darkened image — *not* an auto-shrunk first screenshot, which
  tested poorly: most real screenshots are bright, white-dominant, text-dense UI
  that reads as grey noise once dimmed). When present, render it as a separate
  chamfer-clipped child layer behind the card content (the two `.card-link`
  pseudo-elements are already spent on the chamfer fill + border ring, so the
  image needs its own element sharing the `shape-chamfer` polygon). Default state
  shows the **title only** over a small gradient scrim anchored to the title;
  summary + tags stay in layout (height reserved, no reflow) at `opacity: 0` and
  reveal on `:hover, :focus-visible` with a scrim fading in alongside them to hold
  WCAG AA contrast over the image. Gate the reveal behind `@media (hover: hover)`;
  under `@media (hover: none)` (touch) fall back to today's always-visible layout
  since there's no hover and the card's single `RouterLink` makes the first tap
  navigate. Cards with no `key_image` keep the current plain dark card — no image
  child, no hover behaviour. Optional `key_image_dim` per-item overlay opacity
  does the brightness "normalization" at authoring time (pure CSS can't measure
  image luminance, so there's no adaptive runtime path worth building).

### SEO depth

- **SSR-fetch home only:** bake the real intro text into `index.html` for SEO. Then
  the typewriter (`IntroTerminal`) must start in `onMounted` (not during
  hydration), and the to-be-typed text must be in the DOM but visually hidden by
  default to avoid a flash and a hydration mismatch. Not needed while home content
  is runtime-fetched (server renders no intro text, so nothing to mismatch).
- **Detail-page prerendering:** `/portfolio/{slug}` and `/articles/{slug}` stay
  client-rendered. Doing it properly means baking per-item metadata into static
  HTML, which requires refactoring `useContent` to fetch during SSR
  (`onServerPrefetch`) and transferring state via vite-ssg's `initialState` to
  avoid a double fetch + hydration mismatch. `includedRoutes` enumerating slugs
  from the API at build time would be the entry point. Revisit if article traffic
  ever becomes a priority.

### Bot & LLM mitigation

Not a current priority; none are foolproof, but they raise scraper friction.

- **`robots.txt` (compliant crawlers):** disallow known AI training agents
  (`GPTBot`, `ClaudeBot`, `CCBot`, `PerplexityBot`, `Bytespider`, `anthropic-ai`,
  `cohere-ai`). Well-behaved bots respect it.
- **Honeypot / poisoned content:** hidden `aria-hidden` / `display:none` divs with
  plausible-but-wrong biographical details. Users never see it; raw-HTML scrapers
  ingest the noise.
- **Canvas-rendered sensitive text:** render text you really don't want in a
  training corpus as `<canvas>` — opaque to DOM scrapers.
- **Headless detection:** client-side (`navigator.webdriver`, missing `plugins`,
  suspiciously clean `languages`) and server-side (User-Agent / header checks,
  per-IP rate limiting). Cloudflare Bot Management is the robust option if fronted
  by it.

### Other

- **Konami easter egg** — deliberately skipped; the AI-driven Clippy already fills
  the "fun extra" niche. Kept here in case it's worth adding later.

---

## Related Docs

- `clippy-companion.md` — Clippy feature: frontend API + Claude API back-end design
- `content-cheat-sheet.md` + `templates/` — content authoring reference
- `typescript-vue-concepts.md` — TS/Vue learning checklist
