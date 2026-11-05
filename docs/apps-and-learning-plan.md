# Apps & Learning Refocus — Plan / Ideas

Status: **ideas only, nothing built.** Written 2026-11-04.

## Goal

Shift the site from "portfolio first" to "things I've made that you can use or learn from
first", with skills/portfolio/experience as supporting credibility.

Candidate content: Airscope (Linux wireless/interference tool), server admin app (WIP),
ai-for-dummies.info (educational), Clippy/skills puzzle (already on the site).

## Decisions to make before building

1. **Positioning** — one-line identity. e.g. "Developer who builds tools and teaches" vs
   "portfolio with a projects section". This drives home page copy, nav order, and SEO title.
2. **Apps vs Portfolio** — keep separate. Portfolio = client/employer work (case studies).
   Apps = my own products (download, status, changelog). Different fields, different CTA.
3. **Learn: host or link?** — ai-for-dummies.info is its own site. Default: a "Learn" page
   that curates and links out (cheap); only host content here if it needs to share the SEO.
4. **Where binaries live** — default: GitHub Releases (or equivalent); the site only stores
   links + checksums. No file hosting on the nginx/PHP box.
5. **Nav** — proposed order: Apps · Learn · Articles · Portfolio · Experience.

## Proposed structure

```text
/                   Home: hero (what I make) → featured apps → learn → articles → skills/portfolio teaser
/apps               Index of apps (card per app: name, tagline, status badge, platforms)
/apps/:slug         Detail: description, screenshots, download/install, requirements, changelog, links
/learn              Curated educational resources (ai-for-dummies.info, future guides/tools)
/articles           unchanged
/portfolio          unchanged, demoted in nav + home
/experience         unchanged
```

## Implementation sketch (reuses existing patterns)

- **Content type `apps`** — flat files `content/apps/{slug}.yaml` + sibling `{slug}.md` body
  (same convention as portfolio/articles). New `api/layouts/apps.yaml`.
- **Suggested YAML fields:**

```yaml
title: Airscope
tagline: See Wi-Fi signals and spot interference on Linux
status: alpha            # planned | alpha | beta | stable
platforms: [linux]
version: 0.3.0
downloads:
  - label: Flatpak
    url: https://…
    checksum: sha256:…
repo: https://github.com/…
images:
  - src: main-window.png
    alt: …
tech: [rust, gtk]
```

- **Frontend** — `AppsView` + `AppDetailView` modelled on the portfolio views; reuse
  `ContentCard`, `TechBadge`, `MarkdownRenderer`. New small `StatusBadge` and `DownloadList`
  components. New `types/app.ts`.
- **Featured on home** — a featured-apps manifest + section, same as `featured-portfolio`.
- **Home reorder** — section order is just the list in `api/layouts/home.yaml`; reordering
  and a new hero/intro copy is mostly content, not code.
- **SSG** — extend `includedRoutes()` in `vite.config.ts` to add `/apps/{slug}`; extend
  `injectStructuredData()` with schema.org `SoftwareApplication` (applicationCategory,
  operatingSystem, downloadUrl) per app.
- **Analytics** — `data-umami-event="app-download"` with `app` + `format` props on download
  links; add to the event list in CLAUDE.md.
- **Images** — `frontend/public/images/content/apps/{slug}/`, same gitignore rules as portfolio.

## Phases

1. **Decide** positioning + nav order (above). No code.
2. **Content first** — write Airscope's YAML/MD even before the UI exists; confirms the
   field list is right.
3. **Apps pages** — API layout, types, index + detail views, nav entry. Ship with Airscope
   only; hide the section until it has ≥1 real app.
4. **Home refocus** — new intro, featured apps section, demote skills/portfolio.
5. **Learn page** — simple curated list linking out; add ai-for-dummies.info first.
6. **Polish** — JSON-LD, sitemap check, Umami events, OG images per app.

## Ideas parked for later

- Per-app changelog fed from GitHub releases at build time (the build already fetches the API).
- "Try it" embeds/demos for browser-capable tools (the skills puzzle is already an example).
- Newsletter/RSS for new apps and guides.
- Server admin app: wait for a name and first release before giving it a page.
- Rename the site's tagline/title/meta (`useSeo`) once positioning is settled.

## Risks / watch-outs

- Showing apps that are early alpha: status badge + honest "what works" copy, or it hurts
  credibility more than the portfolio helps.
- Home page doing too much: cap featured sections at ~3 above the fold.
- Portfolio SEO: demoting it in nav shouldn't remove it from the sitemap or internal links.
- Content-only edits still need a full rebuild + `deploy-frontend` (content is baked into
  prerendered HTML).
