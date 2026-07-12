# Article Categories & Filter — Plan

Status: **not started** — deferred until there are enough articles spanning
enough distinct topics that browsing the unfiltered list is unwieldy. No
fixed article count triggers this; it's a judgment call when it starts to
feel needed.

---

## Why now isn't the time

Today's 7 articles are almost all narrow technical write-ups (CSS custom
properties, Vue Composition API, Drupal comparisons) plus one or two that
lean into the broader commentary the [[articles intro]] describes
(`zero-click-search-costs`). A filter needs enough items per category to be
worth clicking — right now "show only Politics" would return zero or one
result.

## Data model

Reuse the `tags?: string[]` field already on `Article`
(`frontend/src/types/article.ts`) — it exists on the type but no article sets
it yet. No new field, no schema migration:

```yaml
tags:
  - Development
  - AI
```

Free-text labels, not the icon-bearing `si:`/`lucide:` tag objects portfolio
items use (see `content-cheat-sheet.md` § Tags / skills) — articles don't need
tech-badge icons, just a category label. An article can carry more than one
tag (e.g. a piece spanning AI and economics).

Don't hardcode the category list anywhere — derive the distinct set from
whatever tags actually appear across published articles (see below), so
adding a new category is just adding a tag to an article, nothing to update
in two places.

## Frontend

All the data needed is already in the manifest response `ArticleListSection`
receives — no API or backend change required. Filtering is client-side only:

- In `ArticleListSection.vue`: a computed set of distinct tags across
  `items`, rendered as a row of filter chips (+ an implicit "All").
- A `ref<string | null>` for the selected tag; filtering is
  `items.filter(i => !selected || i.tags?.includes(selected))` layered on top
  of the existing date sort.
- `ArticleCard.vue` doesn't need to change unless we also want the tag(s)
  shown on the card itself (optional, decide when building).

## Explicitly deferred / not planned yet

- URL query param for the selected filter (`?tag=ai`) so a filtered view is
  shareable/bookmarkable — nice-to-have, add only if it turns out people
  link to filtered views.
- Any server-side filtering — the article count doesn't remotely justify it.
