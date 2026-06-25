# Content Cheat Sheet

Quick reference for authoring flat-file content. For the full system design see
`portfolio-rebuild-plan.md`; for field templates see `templates/`.

Content lives **outside the repo** (gitignored, synced to the server via rsync).
It is fetched at runtime through the API — it is **not** in the web docroot.

---

## Directory layout

```text
content/
├── pages/            One YAML per page section (home-intro.yaml, skills.yaml)
├── manifests/        Ordered slug lists per type (portfolio.yaml, articles.yaml, jobs.yaml)
├── portfolio/        {slug}.yaml + {slug}.md per item
├── articles/         {slug}.yaml + {slug}.md per item
└── jobs/             {slug}.yaml per item (no body)
```

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

- **Portfolio:** `title`, `summary`, `tags[]`, `featured`
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

## Images in Markdown

Images are served as static assets from the **repo**, not the content dir.
Put them in `frontend/public/images/`, organised into subfolders by content:

```text
frontend/public/images/portfolio/job-scout/screenshot.png
```

Reference them with an **absolute** path (leading `/`) — `public/` is served
from the site root:

```markdown
![Job Scout dashboard](/images/portfolio/job-scout/screenshot.png)
```

Do **not** use a relative path (`![](images/foo.png)`) — it resolves against the
current route URL and 404s on detail pages.

> Note: images deploy with the repo build (rsync of `dist/`), on a different
> cadence than the rsync'd content text. Author the `.md` and add the image in
> the same change to keep them in sync.
