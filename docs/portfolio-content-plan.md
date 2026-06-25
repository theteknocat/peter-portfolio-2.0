# Portfolio Content Plan

Plan for replacing the placeholder portfolio items and articles with real
content, driven by an inventory of the GitHub repos Peter has access to and a
measure of his contribution level to each.

Status: **planning only** — the inventory below is captured; the per-repo
contribution scoring and the writing itself are still to do.

---

## What GitHub access gives us

`gh` CLI installed via Homebrew (`brew install gh`), authenticated as
**theteknocat** with scopes `repo`, `read:org`, `gist`, `workflow` — enough to
read private and org repos.

Across all affiliations (owner + collaborator + org member): **130 repos**.

| Owner                    | Count | What it is                                                                                                         |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------ |
| `Kellett-Communications` | 70    | Employer — web agency. Mostly Drupal client sites for NWT/Nunavut/Yukon governments and orgs, plus internal tools. |
| `theteknocat`            | 58    | Personal. Includes the *Biscuit* PHP framework (~40 repos, 2012–13) and modern personal tools.                     |
| `ytgov`                  | 2     | Yukon Government org (client).                                                                                     |

Languages (non-fork): PHP 46, CSS 45, JavaScript 10, Shell 4, plus a little
Python / Blade / Twig. CSS-tagged repos are almost all Drupal sites (theme CSS
dominates the line count).

### Re-running the inventory

```bash
gh api --paginate \
  "/user/repos?affiliation=owner,collaborator,organization_member&per_page=100" \
  --jq '.[] | [.full_name, .private, .fork, .archived, .language, .pushed_at, .description] | @tsv'
```

---

## Measuring contribution level

The contributors endpoint returns per-author commit counts directly — no clone
needed:

```bash
gh api "repos/{owner}/{repo}/contributors?per_page=100&anon=1" \
  --jq 'sort_by(-.contributions)[] | "\(.contributions)\t\(.login // .name // "anon")"'
```

Two things to get right:

1. **Identity merge.** Peter's commits appear under *both* `theteknocat` (his
   linked account) and a name-only `Peter Epp` entry (commits made with a git
   email not attached to his GitHub account). These must be summed. Other email
   identities may exist — confirm by spot-checking `git log --format='%an <%ae>'`
   on a clone, or via the GraphQL contributions API.
   - Worked example — `kellett-lighthouse-laravel`: `theteknocat` 6317 +
     `Peter Epp` 314 ≈ **6600 commits, overwhelmingly primary author**.

2. **Contribution share, not raw count.** What matters for the portfolio is
   whether he *led* the repo. Score each repo as
   `peter_commits / total_commits` and bucket:
   - **Lead / sole** (>60% or sole non-bot author) → strongest portfolio candidates.
   - **Major** (20–60%) → include if the project itself is notable.
   - **Minor** (<20%) → generally skip; he was one of a team.
   - Spot-checks already done: `nt-legislative-assembly` → 63/~960 ≈ **minor**;
     `ytgov/yukon-ca` → not in the top contributors at all ≈ **minor/none**.

   Caveat: `contributors` counts default-branch commits and can lag right after
   a push (GitHub computes stats async, may briefly 202). Squash-merge workflows
   collapse authorship — e.g. `kci_subscriptions` shows a single commit by
   another dev despite real history. Treat counts as a ranking signal, then
   eyeball anything surprising before deciding.

### Scoring script (to run later)

A small script over the inventory: for each non-fork repo pushed in the last
~6 years, pull contributors, merge Peter's identities, emit
`repo, peter_commits, total_commits, share, bucket` sorted by share. ~80 API
calls — a couple of minutes, well within rate limits. Not run yet.

---

## First-pass candidate shortlist

Pre-scoring shortlist — repos worth writing up *if* the contribution score
confirms a lead/major role. Grouped by type.

### Personal — standout

| Repo                                                              | Why it's interesting                                                                                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theteknocat/peter-portfolio-2.0`                                 | This site. Vue 3 + TS + Vite + Slim 4 headless, SSG, AI Clippy. Meta but strong.                                                                                                         |
| `theteknocat/job-scout`                                           | Recent (2026) personal tool — confirm what it does, likely AI-assisted job search.                                                                                                       |
| Biscuit framework (`Biscuit-Core` + ~40 extension repos, 2012–13) | His *own* modular PHP MVC framework. Sole author (`Biscuit-Core`: 13 commits, only contributor). Collapse the ~40 repos into one portfolio item — a depth/history piece, not 40 entries. |
| `theteknocat/pihole-wtm`                                          | Pi-hole + WhoTracksMe integration (Python).                                                                                                                                              |
| `theteknocat/ddev-cleanup`                                        | DDEV container cleanup tool (Python). Small but real.                                                                                                                                    |
| `theteknocat/resume-and-portfolio-drupal`                         | The old Drupal portfolio this site replaces — context, not a showcase.                                                                                                                   |

### Kellett — internal tools (likely lead author)

| Repo                                                                    | Why it's interesting                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `kellett-lighthouse-laravel`                                            | Internal project-management tool, Laravel. **Confirmed ~6600 commits, primary author.** Flagship. |
| `kci-base-site-drupal`                                                  | Drupal 11 base platform powering the agency's sites — architecture story.                         |
| `kci-migrate`                                                           | Reusable Drupal migration framework (process plugins, templates).                                 |
| `kci_subscriptions`                                                     | Drupal 10/11 email subscription module.                                                           |
| `kci_auto_archive`                                                      | Drupal module — auto-archive expired nodes.                                                       |
| `ga4-intelligence-tool`                                                 | GA4 API + Claude for analytics queries (2026). Pairs with the AI-tooling article angle.           |
| `plesk-nginx-bot-limiter`                                               | Bot-mitigation config — directly relevant to the site's own "Bot & LLM Mitigation" plan section.  |
| `server-notification-triage`                                            | Google Apps Script ops automation.                                                                |
| `drush-production-scripts` / `stage-utilities` / `drupal-update-script` | DevOps tooling — could be one combined "agency ops automation" item.                              |

### Kellett / ytgov — client sites (pick flagships by score)

70+ Drupal client sites. Don't list them individually — pick **3–5 flagships**
where the contribution score shows Peter led, ideally recognizable
public-sector sites. Candidates to score first:
`nt-legislative-assembly` (already minor), `ytgov/yukon-ca` (minor),
`mackenzie-valley-review-board-mve-2022-drupal`,
`yukon-hospital-corporation-yhc-2021-drupal`,
`nwt-teachers-association-nwtta-2020-drupal`, and the
`land-and-water-boards-lwb-2020-drupal` multi-site (Domain Access — technically
interesting). The score decides which earn a write-up.

---

## Workflow

1. **Score.** Run the contribution script over the inventory; produce the
   ranked `share`/`bucket` table.
2. **Shortlist.** From this candidate list, keep lead/major repos + any notable
   project regardless of bucket. Aim for ~8–12 portfolio items total (quality
   over the full 130).
3. **Write portfolio items.** For each pick, create the content YAML/Markdown
   (`content/portfolio/{slug}.yaml` per the rebuild plan's content format) —
   summary, tech stack, role, contribution level, links. Pull real detail from
   each repo's README / commit history rather than inventing it.
4. **Update the manifest** (`content/manifests/portfolio.yaml`) and pick which
   items are `featured` for the homepage.
5. **Pick article topics** (below), then draft.

---

## Open-source contributions (drupal.org)

Separate from the GitHub inventory: open-source work — primarily Drupal — to
surface as its own portfolio section. These mostly live on **drupal.org**, not
GitHub, and will largely need to be found manually.

Where to look:

- **drupal.org user profile** (`https://www.drupal.org/u/{username}`) — lists
  maintained projects (modules/themes) and a "Credits" / contribution history.
- **Issue credits** — drupal.org records credited issue contributions per user
  and per release; these are the bulk of most contributors' open-source footprint.
- **Maintained/co-maintained projects** — any contrib modules or themes with
  Peter as a maintainer.
- **Patches / merge requests** — contributions to core or other contrib projects
  that may not show as "maintainer" but carry issue credit.

Capture for each: project name, role (maintainer / contributor / patch),
what it does, link, and rough scope. Once gathered, model them as portfolio
items (or a dedicated "Open Source" section/manifest) alongside the GitHub work.

### drupal.org — confirmed findings

Username: **`teknocat`** — profile `https://www.drupal.org/u/teknocat`
(*Peter Epp*, on drupal.org ~17 years / since ~2009, Kellett Communications —
Senior Developer). The `theteknocat` variant 404s.

**Maintained projects:**

- *Drupal Automatic Updater* — `https://www.drupal.org/project/drupal_automatic_updater`
- *Entity Field Privacy* (sandbox) — `https://www.drupal.org/sandbox/teknocat/2076153`

**Also credited:** security advisories and issue-queue contributions. The
profile summary links "View all" for each but does **not** show counts — pull
these manually:

- Issue credits: profile → "View all issues" (credited issues, by project/release).
- Security advisories: profile → "View all security advisories".

**To do manually:** open each maintained project for a one-line description +
usage/scope, and skim the credited-issues list for any notable core/contrib
patches worth calling out. Then model as portfolio items (or an "Open Source"
manifest).

---

## Articles

Keep the existing generated samples as drafts to tweak (they're decent), but
prioritise articles grounded in real work.

- **Existing idea** (`docs/article-ideas.md`): *Vue Router modal routes* — the
  `frozenComponent` case study + AI-code-review commentary. Real, from this
  repo. Keep.
- **Candidate topics from real projects** (validate against scoring first):
  - Building *Biscuit*, a PHP framework, in 2012 — and what a headless Vue/Slim
    rebuild a decade later changes about how you'd do it. Pairs naturally with
    this portfolio's own architecture.
  - Reusable Drupal migration tooling (`kci-migrate`) — patterns for migrating
    many client sites without rewriting the importer each time.
  - Bot/LLM mitigation in practice (`plesk-nginx-bot-limiter`) — ties into this
    site's own § Bot & LLM Mitigation plan.
  - Using Claude against the GA4 API (`ga4-intelligence-tool`) and AI tooling in
    a small agency's workflow.
  - Running a multi-site Drupal platform (`kci-base-site-drupal` + Domain Access
    land-and-water-boards) for a fleet of government clients.

Cross-reference each draft back into `docs/article-ideas.md` as it's fleshed out.
