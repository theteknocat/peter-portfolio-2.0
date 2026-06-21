# peter-portfolio-2.0

Headless portfolio site. Vue 3 SPA frontend consuming a Slim 4 PHP API.
Flat-file content (YAML/Markdown) — no database.

---

## Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Frontend | Vue 3, TypeScript, Vite, Vue Router, Tailwind CSS 4 |
| Icons    | Simple Icons (tech badges), @lucide/vue (UI icons)  |
| Backend  | Slim 4 (PHP 8.3), PHP-DI, symfony/yaml, phpdotenv   |
| Content  | YAML + Markdown flat files (outside repo)           |
| Dev env  | DDEV (no database container)                        |

---

## Directory Structure

```text
/
├── api/                  PHP backend
│   ├── public/           DDEV docroot — index.php entry point
│   ├── src/
│   │   ├── Handlers/     Route handlers (PageHandler, ManifestHandler, ContentHandler)
│   │   ├── Services/     Business logic (ContentService, ManifestService)
│   │   └── Middleware/   CorsMiddleware
│   ├── layouts/          Page layout YAML files (checked in)
│   ├── composer.json
│   └── .env              Local only — gitignored
│
├── frontend/             Vue 3 SPA
│   ├── public/
│   │   └── images/       Static assets served as-is (body-bg-dark.png, etc.)
│   ├── src/
│   │   ├── assets/
│   │   │   ├── css/      main.css — Tailwind + CSS custom properties + base styles
│   │   │   └── logo.png
│   │   ├── components/
│   │   │   ├── layout/   AppHeader, AppFooter, AppNav
│   │   │   ├── ui/       ContentCard, SectionHeading, TechBadge, MarkdownRenderer
│   │   │   ├── portfolio/
│   │   │   ├── articles/
│   │   │   ├── home/
│   │   │   └── clippy/
│   │   ├── composables/  Reusable fetch logic (useContent, useManifest, usePageConfig)
│   │   ├── types/        TypeScript interfaces (portfolio.ts, article.ts, job.ts, page.ts)
│   │   ├── views/        Route-level page components
│   │   ├── router/       index.ts
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── content/              Gitignored — synced separately via rsync
├── docs/                 Planning and reference documents
└── .ddev/                DDEV config
```

---

## Key Commands

```bash
ddev start                                              # Start dev environment
ddev stop                                               # Stop dev environment
ddev describe                                           # Show URLs and service status

ddev composer install                                   # Install PHP dependencies (runs from api/)
ddev exec --dir /var/www/html/frontend npm install      # Install JS dependencies
ddev exec --dir /var/www/html/frontend npm run dev      # Start Vite dev server
ddev exec --dir /var/www/html/frontend npm run build    # Production build
```

**URLs (when running):**

- API: <https://peter-portfolio.ddev.site>
- Vite dev server: <https://peter-portfolio.ddev.site:5173>

---

## Source References

### Drupal Theme (the site being rebuilt)

- **Theme:** `../resume-and-portfolio-drupal/docroot/themes/custom/peter_portfolio`
- **Base theme (boilerplate CSS reference):** `../resume-and-portfolio-drupal/docroot/themes/custom/base_theme`
- **Compiled CSS (always check this, not SCSS source):**
  `../resume-and-portfolio-drupal/docroot/themes/custom/peter_portfolio/css/style.css`

The old theme is Bootstrap 5. SCSS variables compile — font sizes become fluid `calc()` via
Bootstrap's RFS system, colours become resolved hex values, etc. The SCSS source gives intent;
`style.css` gives the actual values to port.

### Project Docs

- `docs/theme-migration.md` — visual system port guide (colours, typography, decorative elements)
- `docs/source-reference.md` — confirmed compiled values (use when a token needs verification)
- `docs/portfolio-rebuild-plan.md` — overall plan, SEO strategy, feature roadmap
- `docs/typescript-vue-concepts.md` — TS/Vue concepts checklist (tick off as covered)

---

## CSS Architecture

- `src/assets/css/main.css` — single entry point: Google Fonts, Tailwind 4 import,
  CSS custom properties (colour + font tokens), base element styles
- Tailwind `@theme` block extends utilities with project tokens (e.g. `text-accent`, `bg-primary-dark`)
- Component-level decoration (pseudo-elements, clip-path, backdrop-filter) lives in
  `<style scoped>` blocks in each `.vue` file
- No Bootstrap. No utility-only approach — Tailwind for layout/spacing, scoped CSS for decoration.

### CSS Cascade Layer Order

```text
scoped <style> in .vue files        ← always wins (unlayered + attribute specificity)
unlayered global CSS                ← beats all layers (transitions, body state rules, @keyframes)
@layer utilities                    ← Tailwind utilities (flex, p-4, text-xl…)
@layer components                   ← reusable class patterns (.card-link, .nav-link…)
@layer base                         ← element defaults (a, body, h1–h6, p…)
```

### Where to put new styles

| Style type | Where |
| --- | --- |
| CSS custom properties, `@property`, `@font-face` | `tokens.css` or `fonts.css` — unlayered, no layer wrapper |
| Element defaults (`a`, `body`, headings, margins) | `base.css` inside `@layer base` |
| Reusable component classes (`.card-*`, `.btn`, `.tag-list`) | `ui.css` inside `@layer components` |
| One-off component decoration, pseudo-elements, animations | `<style scoped>` in the `.vue` file |
| Page transition classes (`.page-enter-active` etc.) | `transitions.css` — unlayered so they always win |
| JS-toggled body state (`body.modal-open`) | unlayered in the relevant partial |
| `@keyframes` | unlayered (layers don't affect keyframe registration) |

**Tailwind utility override rule:** if a Tailwind utility class isn't winning over a global style, the global style is probably unlayered. Move it to the appropriate `@layer`, or use the `!` prefix (`!flex`) as a last resort.

---

## Icon Conventions

- Simple Icons SVGs (injected via `v-html`) include a `<title>` element that browsers render
  as a native tooltip — always strip it when a custom `v-tooltip` is present.
- Use `stripTitle()` from `@/utils/svg` — never inline the regex in a component.
- Example: `v-html="stripTitle(siDrupal.svg)"`

---

## API Endpoints (not yet implemented)

```text
GET /api/page/{page}
GET /api/manifest/{name}?limit=3&filter=featured
GET /api/content/{type}/{slug}
```

Content path configured via `CONTENT_PATH` env var in `api/.env`.

---

## Working with Peter — Important

Peter is using this project to learn TypeScript and Vue 3 Composition API in depth.
The PHP backend is familiar ground. He has Vue 2 / Options API experience, so draw
parallels to that where helpful. The learning focus is Composition API, composables,
TypeScript patterns in Vue, directives, slots, and advanced router usage.

**Always:**

- Build in small, logical pieces — one component or concept at a time
- Explain what each new TypeScript or Vue Composition API feature does when it first appears
- Draw parallels to the Vue 2 Options API (e.g. "`ref()` is like a reactive `data` property")
- Offer to go deeper on any concept before moving on
- Wait for acknowledgment/review before writing the next piece
- Reference `docs/typescript-vue-concepts.md` — tick off concepts as they come up naturally

**Never:**

- Dump a complete component without walking through it
- Use a TypeScript feature silently without noting what it is
- Assume prior knowledge of TS generics, utility types, `defineProps`, composables, etc.

---

## Commit Message Workflow

Peter commits manually — never run `git commit` or `git add` unless explicitly asked.

When asked to help draft a commit message:

1. Run `git diff --staged` to see what's being committed
2. Draft a message following **Conventional Commits** standard:
   - Format: `type(scope): short description`
   - Types: `feat`, `fix`, `chore`, `style`, `refactor`, `docs`, `test`
   - Example: `feat(frontend): add AppHeader component with marble texture`
   - Body optional for non-trivial changes
3. **After drafting the commit message, update `SESSION.md`** to reflect current progress

---

## SESSION.md

Maintain `SESSION.md` in the project root as a running scratchpad (gitignored).
Update it after every commit message request with a one-line entry:

```text
YYYY-MM-DD | <what was done> | <status> | <next step>
```

Keep under 50 lines — summarise older entries rather than accumulating.
On a new session, read SESSION.md first to restore context.

---

## Documentation Standards

### PHP (api/src/)

Use PHPDoc with **Drupal-style indented descriptions** on tags:

```php
/**
 * Brief one-line description.
 *
 * Longer explanation if needed. Wrap at 80 chars.
 *
 * @param string $slug
 *   The content slug to look up.
 * @param bool $includeBody
 *   Whether to include the full markdown body.
 *
 * @return array<string, mixed>
 *   The parsed content data, or an empty array if not found.
 *
 * @throws \RuntimeException
 *   If the content directory is not readable.
 */
```

All classes, public methods, and non-obvious private methods need docblocks.
Use `@throws` whenever an exception can be raised.

### TypeScript / Vue (frontend/src/)

Use **TSDoc** format:

```typescript
/**
 * Brief one-line description.
 *
 * Longer explanation if needed.
 *
 * @param slug - The content slug to look up.
 * @param includeBody - Whether to include the full markdown body.
 * @returns The parsed content data, or null if not found.
 */
```

Composables, exported functions, and non-obvious helpers all need docblocks.
Vue component files: a brief comment at the top of `<script setup>` describing what
the component does is enough — no need to docblock every prop.

---

## Running Code Quality Tools

```bash
# PHP — from project root
ddev exec --dir /var/www/html/api vendor/bin/phpcs
ddev exec --dir /var/www/html/api vendor/bin/phpstan analyse src

# Frontend — type checking and build verification
ddev exec --dir /var/www/html/frontend npm run build
```

The `.ddev/run-phpcs` and `.ddev/run-phpcbf` wrapper scripts are used by the
phpsab VS Code extension. They translate local file paths to container paths and
invoke phpcs/phpcbf with `--dir /var/www/html/api` so the ruleset in `api/phpcs.xml`
is discovered correctly.

PHP coding standard: PSR-12 + Slevomat (strict types, return/param hints, sorted
imports, early exit) + `drupal/coder` Commenting sniffs for Drupal-style docblocks.
Inline `/** @var \Full\ClassName $var */` annotations are allowed (Drupal sub-sniffs
that block them are excluded in `phpcs.xml`).
