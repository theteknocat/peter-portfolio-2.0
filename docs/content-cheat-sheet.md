# Content Cheat Sheet

Quick reference for authoring flat-file content. For the full system design see
`architecture.md`; for field templates see `templates/`.

Content lives **outside the repo** (gitignored, synced to the server via rsync).
It is fetched at runtime through the API — it is **not** in the web docroot.

---

## Directory layout

```text
content/
├── sections/{page}/  One YAML per section on that page (sections/home/home-intro.yaml, sections/home/skills.yaml)
├── manifests/        Ordered slug lists per type (portfolio.yaml, articles.yaml, jobs.yaml)
├── portfolio/        {slug}.yaml + {slug}.md per item
├── articles/         {slug}.yaml + {slug}.md per item
└── jobs/             {slug}.yaml per item (no body)
```

## Page layouts & sections

Each page has a layout YAML **checked into the repo** at `api/layouts/{page}.yaml`
— a bare ordered list of section source names:

```yaml
sections:
  - intro
  - list
```

Each name maps to `content/sections/{page}/{source}.yaml` (+ optional sibling
`.md`). That file defines everything about the section: which frontend
component renders it (`template`), and either plain fields (a static section)
or a `manifest` (a list-driven section).

**Reordering, adding, or removing sections is a content-only change** — as
long as the `template` already has a matching frontend component, editing the
layout + section files needs no rebuild or deploy of the app itself, just an
rsync of `content/`.

### Static section example

`content/sections/portfolio/intro.yaml`:

```yaml
template: text
title: Selected Work        # optional
```

`content/sections/portfolio/intro.md`:

```markdown
A selection of projects I've built or contributed to, spanning full-stack web
apps, Drupal sites, and personal experiments.
```

### List-driven section example

`content/sections/portfolio/list.yaml`:

```yaml
template: portfolio-list
manifest: portfolio
```

Add `filter:` / `limit:` to narrow it, e.g. home's featured-portfolio section:

```yaml
template: featured-portfolio
title: Featured Work
manifest: portfolio
filter: featured
limit: 3
```

### Optional sections

A layout can reference a source with no content file yet — it's simply
omitted from the page, no error. This is how you toggle an intro on/off
without touching the layout: add `intro.yaml`/`.md` to turn it on, delete
both to turn it off.

The generic `text` template also renders nothing at all if the section file
exists but has neither `title` nor a sibling `.md` body — same effect as
omitting the file.

## The two-file pattern

Each portfolio item / article is a **pair sharing one slug**:

| File          | Holds                                                              |
| ------------- | ------------------------------------------------------------------ |
| `{slug}.yaml` | Metadata — title, summary, tags, `featured`, date                  |
| `{slug}.md`   | The Markdown body (starts at `##` — the title comes from the YAML) |

Jobs are YAML-only (no `.md` body).

To add an item: create both files, then add the slug to the matching
`manifests/{type}.yaml`. **A slug not in the manifest won't appear in lists.**

## Manifests

Ordered list — display order = file order. `featured` here drives
home-page/featured surfaces.

```yaml
- slug: job-scout
  featured: true
- slug: ddev-tools
  featured: false
```

## Frontmatter fields

See `templates/portfolio-item.yaml`, `templates/article.yaml`, `templates/job.yaml`
for the copy-paste starting points. Key fields:

- **Portfolio:** `title`, `summary`, `tags[]`, `featured`, `images[]` (optional)
- **Article:** `title`, `summary`, `date: "YYYY-MM-DD"`, `featured`
- **Job:** `title`, `company`, `start: "YYYY-MM"`, `end: "YYYY-MM" | present`, `summary`, `skills[]`

### Tags / skills

Each entry: required `label`, optional icon from one source:

```yaml
tags:
  - si: php          # Simple Icons slug (brand/tech logos)
    label: PHP
  - lucide: Database # Lucide component name (generic concepts)
    label: Database
  - label: Twig      # text-only, no icon
```

Full list of available `si:` slugs and `lucide:` names is in the header comment
of `templates/portfolio-item.yaml`.

## Images

Images are served as static assets from the **repo**, not the content dir.
They live under `frontend/public/images/content/{type}/{slug}/`:

```text
frontend/public/images/content/portfolio/job-scout/screenshot.png
```

### Portfolio carousel (YAML)

Add an `images:` list to the item's `.yaml`. Each entry needs `src` (filename
only — no path) and `alt`:

```yaml
images:
  - src: home-page.png
    alt: Job Scout home page showing the dashboard
  - src: results-list.png
    alt: Search results with match scores
```

### Images in Markdown body

Reference them with an **absolute** path (leading `/`) — `public/` is the
site root:

```markdown
![Job Scout dashboard](/images/content/portfolio/job-scout/screenshot.png)
```

Do **not** use a relative path (`![](images/foo.png)`) — it resolves against
the current route URL and 404s on detail pages.

> Note: images deploy with the repo build (rsync of `dist/`), on a different
> cadence than the rsync'd content text. Author the `.md`/`.yaml` and add the
> image file in the same change to keep them in sync.
