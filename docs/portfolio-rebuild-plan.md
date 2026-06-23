# Portfolio Site Rebuild Plan

## Implementation Status (as of 2026-06-22)

The frontend SPA and Slim API are functionally complete: all four pages (home,
portfolio, articles, job history) render live content from the API, portfolio
and article detail views work as routed modals, and the full visual system is
ported (see theme-migration.md — every section there is ticked off). UI
components (`TechBadge`, `ContentCard`, `MarkdownRenderer`, `PageTitle`) and the
content composables (`usePageData`, `useContent`, `useModalNavigation`) are built.

**Done since:** SEO/SSG via vite-ssg (per-route metadata, robots.txt, sitemap) — see § SEO.

**Remaining:**

- Build & deploy: documented (§ Build output & deploy workflow); execute on the server when ready
- AppFooter mobile responsiveness
- Nice-to-have: Clippy companion, Konami easter egg

---

## Overview

A modern headless portfolio site with a Vue 3 SPA frontend consuming a lightweight Slim 4 PHP API. Content is managed via flat YAML/Markdown files outside the repository, synced locally and to the server via rsync. The public GitHub repo demonstrates the full stack while keeping content separate and privately managed.

## Goals

- Demonstrate Vue 3, TypeScript, Vite, and modern frontend architecture
- Show clean API design via Slim 4
- Maintain the existing cyberpunk art-deco aesthetic with improved UX
- Make content easy to add and update without touching code
- Surface portfolio work and articles effectively from the homepage
- Provide a public code repo employers can browse

---

## Stack

### Frontend

- **Vue 3** with Composition API
- **TypeScript**
- **Vite** for build tooling
- **Vue Router** for SPA client-side routing
- **marked.js** for client-side Markdown rendering
- **js-yaml** for any client-side YAML parsing if needed

### Backend

- **Slim 4** PHP micro-framework
- **symfony/yaml** for YAML parsing
- Flat-file content layer — no database

### Content Layer (outside repo)

- YAML files for structured content (portfolio items, job history, skills)
- Markdown files for long-form prose (article bodies)
- YAML manifests for ordering and listing content

---

## Repository Structure

```text
/
├── frontend/                        # Vue 3 SPA
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Static assets, fonts, global CSS
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppHeader.vue
│   │   │   │   ├── AppFooter.vue
│   │   │   │   └── AppNav.vue
│   │   │   ├── ui/                  # Reusable UI primitives
│   │   │   │   ├── TechBadge.vue
│   │   │   │   ├── ContentCard.vue
│   │   │   │   └── MarkdownRenderer.vue
│   │   │   ├── portfolio/
│   │   │   │   ├── PortfolioList.vue
│   │   │   │   └── PortfolioItem.vue
│   │   │   ├── articles/
│   │   │   │   ├── ArticleList.vue
│   │   │   │   └── ArticleCard.vue
│   │   │   └── home/
│   │   │       ├── HeroSection.vue
│   │   │       ├── FeaturedWork.vue
│   │   │       ├── FeaturedArticles.vue
│   │   │       └── SkillsSection.vue
│   │   ├── views/                   # Route-level page components
│   │   │   ├── HomeView.vue
│   │   │   ├── PortfolioView.vue
│   │   │   ├── PortfolioItemView.vue
│   │   │   ├── ArticlesView.vue
│   │   │   ├── ArticleView.vue
│   │   │   └── JobHistoryView.vue
│   │   ├── composables/             # Reusable API fetch logic
│   │   │   ├── usePageData.ts       # Fetch fully resolved page (layout + all content)
│   │   │   └── useContent.ts        # Fetch single content item (modal/detail views)
│   │   ├── types/                   # TypeScript interfaces
│   │   │   ├── portfolio.ts
│   │   │   ├── article.ts
│   │   │   ├── job.ts
│   │   │   └── page.ts
│   │   ├── router/
│   │   │   └── index.ts
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── api/                             # Slim 4 PHP backend
│   ├── public/
│   │   └── index.php                # Entry point
│   ├── src/
│   │   ├── Handlers/
│   │   │   ├── PageHandler.php      # GET /api/page/{page}
│   │   │   └── ContentHandler.php   # GET /api/content/{type}/{slug}
│   │   ├── Services/
│   │   │   ├── ContentService.php   # File reading, YAML/Markdown parsing
│   │   │   └── ManifestService.php  # Manifest loading and slug resolution (internal)
│   │   └── Middleware/
│   │       └── CorsMiddleware.php
│   ├── layouts/                     # Page layouts (checked in — structure only)
│   │   ├── home.yaml
│   │   ├── portfolio.yaml
│   │   ├── articles.yaml
│   │   └── job-history.yaml
│   ├── composer.json
│   └── .htaccess
│
└── README.md
```

---

## Content Directory Structure (not in repo)

Lives at a configurable path on the server (e.g. `/var/content/peter-epp/`), mirrored locally.

```text
/content/
├── manifests/                       # Ordered content lists
│   ├── portfolio.yaml               # Ordered refs to portfolio items
│   ├── articles.yaml                # Ordered refs to articles
│   └── jobs.yaml                    # Ordered refs to job history entries
│
├── portfolio/                       # One YAML file per project
│   ├── lighthouse.yaml
│   ├── lwb.yaml
│   ├── ga4-intelligence.yaml
│   ├── server-notification-triage.yaml
│   ├── pihole-dashboard.yaml
│   └── ...
│
├── articles/                        # One Markdown file per article
│   ├── ai-tooling-strategy.md
│   ├── drupal-9-to-10.md
│   └── ...
│
├── jobs/                            # One YAML file per role
│   ├── kellett-senior-dev.yaml
│   └── weaver-devore.yaml
│
└── skills.yaml                      # Master skills list with categories
```

---

## Content File Formats

### Manifest (e.g. `manifests/portfolio.yaml`)

```yaml
items:
  - lighthouse
  - ga4-intelligence
  - lwb
  - pihole-dashboard
```

Just an ordered list of slugs. Reorder to change display order. Add a slug to include a new item.

### Portfolio Item (e.g. `portfolio/lighthouse.yaml`)

```yaml
title: Lighthouse
slug: lighthouse
date_start: 2007
date_end: present
featured: true
external_url: ~
technologies:
  - laravel
  - php
  - vuejs
  - mysql
  - rest-apis
  - responsive-design
summary: |
  Short summary shown in list view.
body: |
  Full markdown content shown on detail view.

  ## What is this?

  Lighthouse is the internal custom project management tool...
gallery:
  - filename: lighthouse-dashboard.png
    alt: Lighthouse dashboard view
```

### Article (e.g. `articles/ai-tooling-strategy.md`)

```markdown
---
title: Problem-First AI Strategy
slug: ai-tooling-strategy
date: 2026-04-15
featured: true
summary: Why the question "how can we use AI?" is the wrong starting point, and what to ask instead.
tags:
  - ai
  - strategy
  - development
---

Full article content in markdown...
```

### Page Layout (e.g. `config/pages/home.yaml`, checked in)

Defines page structure only — no content. The server resolves all `manifest` and `source`
references at request time and embeds the data in the response.

```yaml
sections:
  - type: hero
    source: home-hero         # content file key
  - type: featured-portfolio
    manifest: portfolio
    limit: 3
    filter: featured
  - type: featured-articles
    manifest: articles
    limit: 3
    filter: featured
  - type: skills
    source: skills
```

---

## API Endpoints

All responses are `application/json`. Markdown is returned as raw strings for client-side rendering.

Two endpoints only. Manifests are resolved server-side — the frontend never fetches them directly.

```text
GET /api/page/{page}
  Returns a fully resolved page: the layout structure with all manifest items
  and content already fetched and embedded. One request per page view.

GET /api/content/{type}/{slug}
  Returns a single content item by type and slug.
  Used by modal/detail views (PortfolioItemView, ArticleView).
  Types: portfolio, article, job
```

### Page layout vs manifest vs content

- **Page layout** (`api/layouts/{page}.yaml`, checked into repo): defines the structure
  of a page — what sections exist, what type they are, which manifest or content source each
  section draws from, and any query parameters (limit, filter). Changing a page's structure
  requires a code commit and deploy.

- **Manifest** (`content/manifests/{name}.yaml`, outside repo): an ordered list of content
  slugs. Controls which items appear and in what order. Reordering or adding items only
  requires rsyncing the content directory — no code change needed.

- **Content** (`content/{type}/{slug}.yaml` or `.md`, outside repo): the individual items
  that manifests reference. Also rsync-only to update.

> **Future — multi-column layouts:** a section `type: two-column` with a `columns` array of
> child sections, each with their own `type`/`source`/`manifest`. Backend `resolveSection()`
> would recurse into `columns`; frontend component receives two pre-resolved children and
> renders them side by side using the same dynamic component lookup. Same pattern, one level
> deeper — not complex to add when needed.
>
> **Future — multiple markdown fields:** if a content item needs more than one markdown field, use an `@` sigil in the
> YAML value to reference a separate file — e.g. `intro: "@my-project-intro"` would cause
> `ContentService` to load `content/portfolio/my-project-intro.md` and substitute its contents
> in place of the string. Not implemented yet — the current single `.md` body convention covers
> all known cases.

Data flow for a manifest-backed section:

```text
page layout → names a manifest + params (limit, filter)
  → manifest → ordered list of slugs
    → content files → resolved item data
      → embedded in section response
```

### Example Response — `GET /api/page/home`

```json
{
  "sections": [
    {
      "type": "hero",
      "content": { "title": "...", "body": "..." }
    },
    {
      "type": "featured-portfolio",
      "items": [
        {
          "slug": "lighthouse",
          "title": "Lighthouse",
          "date_start": 2007,
          "date_end": "present",
          "featured": true,
          "summary": "Short summary...",
          "technologies": ["laravel", "php", "vuejs"]
        }
      ]
    },
    {
      "type": "featured-articles",
      "items": [
        {
          "slug": "ai-tooling-strategy",
          "title": "Problem-First AI Strategy",
          "date": "2026-04-15",
          "summary": "..."
        }
      ]
    },
    {
      "type": "skills",
      "items": { "languages": ["php", "typescript"], "frameworks": ["vue", "slim"] }
    }
  ]
}
```

### Example Response — `GET /api/content/portfolio/lighthouse`

```json
{
  "slug": "lighthouse",
  "title": "Lighthouse",
  "date_start": 2007,
  "date_end": "present",
  "featured": true,
  "summary": "Short summary...",
  "technologies": ["laravel", "php", "vuejs"],
  "body": "Full markdown content...",
  "gallery": [{ "filename": "lighthouse-dashboard.png", "alt": "Lighthouse dashboard view" }]
}
```

---

## Vue Router Routes

Top-level routes render into the default `<RouterView>`. Second-level (detail) routes use named views — the parent listing renders in the `default` view (visible behind the modal), and the item renders in the `modal` view.

```typescript
// Top-level — full page transitions
/                    → { default: HomeView }
/portfolio           → { default: PortfolioView }
/articles            → { default: ArticlesView }
/job-history         → { default: JobHistoryView }

// Second-level — modal overlay, parent stays visible behind
/portfolio/:slug     → { default: PortfolioView, modal: PortfolioItemView }
/articles/:slug      → { default: ArticlesView,  modal: ArticleView       }
```

`meta.modal: true` flags modal routes so `App.vue` knows to render the overlay.

---

## Navigation Architecture & Transitions

### Top-level page transitions

The default `<RouterView>` in `App.vue` is wrapped in Vue's `<Transition>` component. Each top-level route carries a `meta.transition` value; a watcher sets the active transition name dynamically so direction (forward/back) can vary the animation.

**Effect:** The current page's content container drops forward and fades out (`translateY` + slight `rotateX` + `opacity → 0`). The incoming page flips up from below and fades in (reverse). Achieved with CSS `perspective` + 3D transforms on the `ContentCard` wrapper — not the full viewport.

Key CSS properties: `perspective`, `transform-style: preserve-3d`, `rotateX`, `translateY`, `opacity`, `transition`.

### Modal / overlay routing (second-level)

`App.vue` has two `<RouterView>` elements:

```html
<RouterView />               <!-- main content, always present -->
<RouterView name="modal" />  <!-- modal overlay, active on modal routes only -->
```

The `modal` RouterView is wrapped in a `<Transition>` (fade + scale or slide-up) and rendered inside a `ModalOverlay.vue` wrapper that provides:

- Full-viewport backdrop (semi-transparent dark)
- Scroll lock on the background content
- Close button → `router.back()` (or `router.push(parentPath)` if navigated to directly)
- Keyboard `Escape` to close

When navigating directly to a second-level URL (e.g. bookmarked `/portfolio/lighthouse`), the parent listing is still shown in the default view because the route definition includes `PortfolioView` as the `default` component — there's no special handling needed for direct access.

### New components required

- `ModalOverlay.vue` — `src/components/layout/ModalOverlay.vue`
  Backdrop + close affordance. Wraps the modal `<RouterView>`. Watches `route.meta.modal` to show/hide.

- `ContentCard.vue` — `src/components/ui/ContentCard.vue`
  The decorated container (double border + corner brackets). The 3D page transition is applied to this element, so it must exist before transitions are wired up.

### Known trade-offs to revisit

- The `default` view re-renders `PortfolioView` every time `/portfolio/:slug` is navigated to. Component caching with `<KeepAlive>` on the default RouterView may be desirable once the API is wired up, to avoid re-fetching the listing on every modal open/close.
- Transition direction (forward vs back) requires tracking navigation history or comparing route depths — simplest initial approach is a single transition style for all top-level moves, with directional variants added later.

---

## TypeScript Interfaces

```typescript
// types/portfolio.ts
export interface PortfolioItem {
  slug: string
  title: string
  date_start: number | string
  date_end: number | string
  featured: boolean
  external_url?: string
  technologies: string[]
  summary: string
  body?: string          // only present on detail fetch
  gallery?: GalleryImage[]
}

export interface GalleryImage {
  filename: string
  alt: string
}

// types/article.ts
export interface Article {
  slug: string
  title: string
  date: string
  featured: boolean
  summary: string
  body?: string          // only present on detail fetch
  tags: string[]
}

// types/job.ts
export interface Job {
  slug: string
  title: string
  company: string
  location: string
  date_start: string
  date_end: string
  body: string
}
```

---

## Content Workflow

### Local Development

```bash
# Start Slim API dev server
cd api && php -S localhost:8080 public/index.php

# Start Vue dev server
cd frontend && npm run dev

# Content lives at ~/content/peter-epp/ locally
# API config points to this path via environment variable
```

### Publishing Content

```bash
# Sync content to server (one command)
rsync -avz --delete ~/content/peter-epp/ user@server:/var/content/peter-epp/
```

### Deploying Code

```bash
# API code (server): pull + install, no build step
git pull origin main
cd api && composer install --no-dev

# Frontend: built LOCALLY (no Node on server), then shipped
npm run build --prefix frontend
rsync -avz --delete frontend/dist/ user@server:/var/www/peter-epp/
```

Code and content deployments are fully independent.

---

## Environment Configuration

```ini
# api/.env (not in repo)
CONTENT_PATH=/var/content/peter-epp
APP_ENV=production
```

```ini
# api/.env.local (not in repo, local dev)
CONTENT_PATH=/home/peter/content/peter-epp
APP_ENV=development
```

---

## SEO

The site is a client-side Vue 3 SPA — crawlers get a near-empty `index.html` until JavaScript executes. The fix is static site generation (SSG) at build time: pre-render every route to a real HTML file so crawlers receive fully-formed `<head>` + page chrome immediately.

### Implemented: `vite-ssg`

`vite-ssg` wraps the existing Vite + Vue Router setup with minimal changes:

- `main.ts` exports a `ViteSSG(App, { routes }, setupFn)` factory instead of `createApp().mount()`; the router singleton moved to `routes` exported from `router/index.ts`.
- Build output gains one **flat** HTML file per static route (`dist/portfolio.html`, `dist/articles.html`, `dist/job-history.html`, `dist/index.html`) — *not* `/portfolio/index.html`. This matters for the nginx `try_files` line below.
- The static HTML carries the full `<head>` + chrome (header/nav/footer) + a `Loading…` body placeholder. **Page/item body content is fetched at runtime** (`usePageData` / `useContent` run in `onMounted`), so it is not baked — it hydrates client-side. This was a deliberate Phase 1 call: name searches surface via the homepage and per-page metadata, and there's little value in baking 100% static body content.
- No framework migration required; same codebase, same router, same components.

**Versions:** `vite-ssg` ^28 with `@unhead/vue` ^2 (must match the copy `vite-ssg` bundles — a v3 mismatch silently writes head tags to an instance vite-ssg never reads). Build command is `vue-tsc && vite-ssg build` (plain `vite build` does **not** prerender).

**Trade-off vs Nuxt 3:** Nuxt is more mature but requires architectural migration. `vite-ssg` is the right call while still establishing Vue 3 / TypeScript patterns. Revisit a Nuxt migration after the site is feature-complete.

### Per-route metadata: `useSeo` composable

`frontend/src/composables/useSeo.ts` wraps `useHead` and emits, for each route,
the `<title>`, `<meta description>`, `<link rel="canonical">`, and Open Graph +
Twitter Card tags — all derived from `https://peter-epp.dev`. Each of the four
static views calls it with its own title/description (current copy is
placeholder). `og:image` is intentionally omitted until a share-card image
exists; JSON-LD was not added.

### Implemented alongside

- `robots.txt` in `frontend/public/` (allow all + sitemap link).
- `sitemap.xml` generated at build time by `ssgOptions.onFinished` in
  `vite.config.ts`, which walks `dist/` for prerendered `.html` files. Any new
  prerendered route appears automatically — no second edit.

### Detail-page prerendering: intentionally skipped

`/portfolio/{slug}` and `/articles/{slug}` are **not** prerendered — they stay
client-rendered SPA routes. Doing it properly would mean baking real per-item
metadata into the static HTML, which requires refactoring `useContent` to fetch
during SSR (`onServerPrefetch`) and transferring that state to the client via
vite-ssg's `initialState` to avoid a hydration mismatch + double fetch. Given the
stated goal (name searches, already covered by the homepage), the marginal
per-article search value didn't justify the refactor. Revisit if article traffic
ever becomes a priority — `includedRoutes` would enumerate slugs from the API at
build time as the entry point.

### Client-side animation vs. SSG (hydration + SEO)

**Current state (Phase 1): not an issue.** Home page content (the intro
subtitle/body) is fetched at runtime via `usePageData` in `onMounted`, so it is
*not* in the prerendered `index.html` — the static file shows only the chrome +
a `Loading…` placeholder. Because the server renders no intro text, there is
nothing for the client's first paint to disagree with: `IntroTerminal`'s
typewriter starts from empty strings after the data fetch, so there's no
hydration mismatch and no hidden-text-for-SEO requirement. The typewriter
already (correctly) runs only in `onMounted`.

**If home content is ever SSR-fetched** (baking the real intro text into
`index.html` for SEO — see "SSR-fetch home only", deferred), the following would
then apply, because the static HTML would contain the full text the typewriter
animates over:

1. Server output must contain the full text (it's what counts for SEO).
2. First client render must equal the server render — start the typewriter in
   `onMounted`, not during render/hydration.
3. Avoid the flash — keep the to-be-typed text in the DOM but visually hidden
   by default (`opacity: 0` / `visibility: hidden`), and let `onMounted` control
   visibility: reveal-and-type on the first animated load, reveal-in-full
   otherwise. Keep the hidden copy identical to the visible copy (mirrored, not
   keyword-stuffed).

### Build output & deploy workflow

The generated static HTML is a **build artifact, not source** — `vite-ssg`
outputs to the gitignored `frontend/dist/` and it is never committed.

**Deploy model (Option B):** build locally, ship the artifact. The server runs
nginx + PHP-FPM only — **no Node, no server-side build**.

```text
Build (local):  npm run build  →  dist/ (HTML + hashed assets + robots.txt + sitemap.xml)
                No API needed at build — page/item content is fetched at runtime, not baked.

Deploy:
  - rsync dist/ → nginx web root
  - rsync content/ → server CONTENT_PATH (read by the PHP API at runtime; content lives outside the repo)
  - API code: git pull + composer install on the server

nginx:  try_files $uri $uri.html /index.html;   # flat .html: /portfolio → portfolio.html
        /api/* → PHP-FPM (unchanged)
```

**Content-only change:** rsync `content/` alone — it goes live immediately
because the API reads the fresh files at runtime. A rebuild is only needed for
frontend code changes or SEO-copy edits (titles/descriptions), since those are
the only things baked into the static HTML. (This is the inverse of a
fully-static-body SSG, where every content edit would force a rebuild.)

---

## Bot & LLM Mitigation

*Documenting for future implementation — not a current priority.*

None of these are foolproof, but they raise friction and cost for scrapers.

### Compliant crawlers — `robots.txt`

Add `frontend/public/robots.txt`. Disallows known AI training crawlers; well-behaved bots respect it. Known agents to block at time of writing: `GPTBot`, `ClaudeBot`, `CCBot`, `PerplexityBot`, `Bytespider`, `anthropic-ai`, `cohere-ai`.

### Honeypot / poisoned content

Hidden `aria-hidden` / `display:none` divs containing plausible-sounding but deliberately wrong biographical details. Users never see it. Scrapers that process raw HTML or ignore CSS ingest it and propagate the noise. Injects misinformation into any model trained on the page — the "give them the middle finger" option.

### Canvas-rendered sensitive text

Render any text you really don't want in a training corpus (specific claims, key phrases) as a `<canvas>` element. Opaque to DOM scrapers; requires image understanding to extract.

### Headless browser detection

Client-side: check `navigator.webdriver`, missing `navigator.plugins`, suspiciously clean `navigator.languages`, etc. If detected, swap visible content for a redirect or the honeypot content. Not foolproof (headless Chrome is increasingly hard to distinguish) but filters unsophisticated bots.

Server-side (PHP API): inspect `User-Agent`, check for missing standard headers, apply rate limiting per IP. Cloudflare Bot Management is the more robust solution if the site is behind Cloudflare.

---

## Homepage Strategy

The current homepage undersells everything. The rebuilt homepage should:

- **Hero section** — brief, punchy intro. Who you are, what you do, what makes you interesting right now (AI tooling angle front and centre). Not a wall of text.
- **Featured work** — 3 portfolio cards pulled from manifest with `featured: true`, enough to intrigue, linking to full portfolio
- **Featured articles** — 2-3 article cards, showing you have opinions and write about them
- **Skills** — keep the icon-based approach from the current site, but updated to reflect current stack including AI/LLM tooling

---

## New Content to Add

### Portfolio Items to Write Up

- GA4 Analytics Intelligence SPA (Alpine.js + PHP/Slim + Anthropic API)
- Server Notification Triage Tool (Google Apps Script + Claude API)
- Pi-hole Intelligence Dashboard (Python, Docker, QNAP)
- Drupal AI Chatbot Prototype
- Job Listing Aggregator (Alpine.js + Slim + Eloquent + Adzuna API)
- Update Lighthouse entry (current screenshots and features are outdated)

### Skills to Add

- AI/LLM tooling (Anthropic API, Claude Code)
- Alpine.js
- Python
- Docker
- Tailscale / self-hosting / server administration depth
- Cloudflare

### Articles Pipeline

- Problem-first AI strategy (vs tool-first)
- Building an agentic analytics tool — what the loop actually looks like
- Why "AI makes you 10x faster" is the wrong frame
- What vibe-coding without fundamentals actually costs you

---

## The Clippy Feature

### Concept

A resurrected Clippy companion that appears on page load and navigation, delivers a contextually relevant quip or pointer, and offers a small set of canned navigation buttons. **No open chat input.** This is faithful to classic Clippy behaviour - not genuinely useful, occasionally charming, easily dismissed. Visitors who hate it can ignore it. Visitors who love it will remember the site.

The Anthropic API can be used to generate Clippy's contextual comment based on the current page and its content - streamed into his speech bubble for full effect - but users never type anything to him. He talks at you, not with you.

### Behaviour

- Appears on initial page load and optionally on route change
- Delivers a short, contextually aware comment based on the current page
- Offers 2-4 canned button responses (navigation links, dismiss, maybe a "tell me more" that triggers a second scripted comment)
- Has idle animations when not speaking, per the classic behaviour
- Can be dismissed and stays dismissed for the session (localStorage flag)
- Self-aware and slightly dry in tone - fits the site's personality

### Example Interactions

- **Homepage:** "It looks like you're visiting Peter's portfolio. Would you like to see his work?" → [Show me] [I'll look around]
- **Portfolio:** "It looks like you're browsing projects. Peter has done some interesting AI tooling work recently." → [Show me those] [Back to home]
- **Articles:** "It looks like you're looking for something to read. Peter has opinions about AI. Brace yourself." → [Let's see] [Maybe later]
- **Job History:** "It looks like you're checking if Peter is employable. He is." → [Back to portfolio] [Contact him]

### Implementation Notes

> **Needs further investigation before building** - evaluate the libraries below and confirm which is best maintained and most Vue 3 friendly before committing.

**Recommended starting point:** `clippyjs` by pithings (`github.com/pithings/clippy`) - a modern rewrite with the full animation set, Web Speech API TTS, and a `speakStream()` method that accepts an async iterable, making it purpose-built for streaming LLM output into the speech bubble.

**Alternative:** `modern-clippy` (`github.com/vchaindz/modern-clippy`) - TypeScript-native, dependency-free, simpler API. Worth evaluating if clippyjs has integration friction with Vue 3.

**Things to investigate:**

- Vue 3 integration story for both libraries (wrapping in a composable or component)
- Whether clippyjs assets need self-hosting or pull from a CDN
- Animation set available and whether idle animations are configurable
- Whether the speech bubble styling can be themed to fit the cyberpunk art-deco aesthetic without too much pain
- Anthropic API streaming via `speakStream()` in practice

### Vue Component Shape

```text
src/components/
  clippy/
    ClippyCompanion.vue    # Main wrapper, handles show/hide/session state
    ClippyMessage.vue      # Speech bubble with action buttons
```

The companion component watches the current route, calls the Anthropic API with page context, and streams the response into Clippy's speech bubble via `speakStream()`. Button options are defined per-route in a config object, not generated by the API.

---

## Claude Code Migration Notes

When using Claude Code to port the existing theme:

- Point it at the live site or the Drupal theme directory to extract CSS custom properties, colour palette, typography, and the art-deco geometric background pattern
- The corner bracket decorative elements on cards should be recreated as Vue components or CSS pseudo-elements
- Font choices and the gold/cyan/dark colour scheme should be extracted as CSS custom properties in a global theme file
- The tech icon badge pattern should become a reusable `TechBadge.vue` component accepting a technology slug and resolving to the correct icon and label
- Preserve the monospace feel of the typography while modernising the overall layout weights and spacing
