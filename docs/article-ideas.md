# Article Ideas

Ideas for articles to write after initial content migration is complete.
Each entry includes enough detail to expand with Claude's help later.

---

## Vue Router modal routes: when the "correct" fix doesn't exist

### Core problem

Building a portfolio site where detail pages (portfolio items, articles) open
in a modal overlay rather than replacing the current page. Requirements:

- URL changes so the modal is deep-linkable and shareable
- Background page stays visible and frozen underneath the modal
- Closing the modal behaves like going back — returns to wherever the user
  came from, not necessarily the URL parent path
- No unnecessary API requests or visual jank (background shouldn't flicker
  to a different page and back)
- Works correctly on direct load of a modal URL

Vue Router + named views (`<RouterView name="modal">`) handles the overlay
part. The hard part is keeping the background frozen.

### The naive "correct" solution and why it fails

Vue Router's named views let a route define two simultaneous components —
one for the background, one for the modal:

```js
{
  path: '/portfolio/:slug',
  components: {
    default: HomeView,   // background
    modal: PortfolioDetail
  }
}
```

This works if modals are only ever opened from one specific page. It breaks
when a modal can be opened from anywhere (home page, portfolio listing, a
link inside another modal). You'd need to know the origin at route-definition
time, which you don't.

### The actual solution: frozenComponent

Capture whatever component was actively rendering in the background RouterView
immediately before the modal navigation happened, and keep rendering it while
a modal is open.

```typescript
const frozenComponent = shallowRef<object | null>(null)

function backgroundComponent(comp: object | null, isModal: boolean): object | null {
  if (!isModal && comp) frozenComponent.value = comp
  return isModal ? frozenComponent.value : comp
}
```

Called from the RouterView v-slot during render — the only place the resolved
component constructor is accessible (it isn't available in script setup).

### Why the alternative "cleaner" approach also doesn't work

The obvious refactor is to capture `frozenComponent` in a route watcher using
`route.matched[0].components.default` instead of during render. This avoids
writing reactive state during a render function.

It fails because modal routes are nested children of page routes (e.g.
`/portfolio/:slug` is a child of `/portfolio`). When you navigate to
`/portfolio/:slug` from the home page, `route.matched` contains the portfolio
route hierarchy — HomeView isn't in it at all. The watcher would capture
the wrong component (or nothing).

The render-time capture works precisely because it records what was actually
on screen, not what the URL hierarchy implies should be there.

### Why it's actually safe despite being an anti-pattern

Writing reactive state during render is a code smell — it can cause render
loops or state corruption in the general case. Here it's safe because:

- The write is guarded by `!isModal && comp` — when any modal is open,
  `frozenComponent` is completely locked and never overwritten
- Modal-to-modal navigation (one detail page linking to another) is safe for
  the same reason: `isModal` stays true throughout the chain
- The things that trigger App.vue re-renders (route changes, pageKey updates)
  are synchronous and always produce the correct `comp` — there's no async
  window where a stale component could slip through
- CSS custom property writes (rAF loops for specular highlights, tooltips)
  go straight to the DOM and don't trigger Vue re-renders at all

### The meta-point: AI code review tools and academic bugs

This pattern was flagged as "Significant" by an AI-generated code review.
The report was academically correct — writing to a ref during render is an
anti-pattern. But:

- The actual risk in this specific usage is near-zero
- The "correct" fix (watcher + route.matched) doesn't work given the routing
  structure
- Understanding why required: knowing the routing structure, how route.matched
  works with nested routes, what actually triggers Vue re-renders, and what
  the design intent was

A human reviewer without full context spent more time validating the report
than the theoretical bug ever warranted. The review marked it Significant
because it pattern-matched against a known anti-pattern, not because it
understood the guards or the design constraints that made the naive fix
unworkable.

The broader point: "this is a code smell" and "this is a bug" are different
claims. AI reviews are good at the former and poor at the latter, because
the latter requires understanding intent.

### Possible angle for the article

Frame it as a case study: here's a real problem, here's why the obvious
router-idiomatic solution doesn't fit, here's the unconventional approach
that does, here's why it's actually safe, and here's what an AI reviewer
made of it. Useful for Vue developers dealing with non-standard routing
patterns and as a commentary on the current state of AI code review.

---

## Drupal vs. the AI-driven low-code CMS wave: where custom Drupal still wins

### Core problem

"Drupal vs WordPress" is a done-to-death topic — search results are years
deep and both platforms are showing their age as a head-to-head framing.
The more current story is Drupal positioning itself against a new wave of
AI-native, low-barrier-to-entry site builders (and against WordPress's own
decline), while doubling down on the enterprise/custom-build segment where
it has always actually competed. This ties directly to Peter's day job at
Kellett Communications (a Drupal shop) and his current hands-on work with
the Drupal AI module building a chatbot for the LWB site
([content/portfolio/mvlwb.md] — cross-reference).

### The WordPress market-share story is more nuanced than "Drupal is winning"

WordPress's dip isn't Drupal or other CMSs taking share — it's the
fast-growing "None" (no detectable CMS) category tracked by W3Techs-style
market-share surveys, driven by AI-built static sites: Framer, Webflow AI,
v0, and prompt-to-site generators produce output that doesn't register as
running any CMS at all.
That's a genuinely new competitor category that didn't exist a few years
ago — not a rotation toward Drupal.

WordPress's exposure is largely self-inflicted: Wordfence attributes roughly
55.9% of known WordPress attack entry points to plugin vulnerabilities — a
direct cost of the huge plugin marketplace that is also WordPress's biggest
selling point.

### Drupal CMS 2.0: Drupal's answer to the low-code segment

Launched January 28, 2026 — [Drupal.org announcement](https://www.drupal.org/blog/drupal-cms-20-is-here-visual-building-ai-and-site-templates-transform-drupal):

- **Drupal Canvas** — visual drag-and-drop page builder, live preview, no more
  switching between admin form and preview window. Built on a "Mercury"
  component library (cards, heroes, testimonials, accordions).
- **AI-powered site building** — an admin chatbot handles site-building tasks
  (create content types, define taxonomy terms, add fields); Canvas AI can
  generate a complete, structured landing page from a text prompt using
  Mercury components; AI-assisted alt text generation with human review.
- **Site templates** — feature-complete starting points (first one, "Byte," is
  a SaaS marketing site: blog, newsletter signup, pricing, contact form) that
  install in under 3 minutes.
- **Recipes** — the underlying packaging mechanism (prepackaged module +
  config bundles) that makes all of the above installable as a unit.
- Built on Drupal Core 11.3 — biggest performance jump in a decade, 26-33%
  more requests served on the same infrastructure.

This is Drupal explicitly building a low-cost, low-skill on-ramp — the
market WordPress has owned for two decades — while keeping the enterprise
core intact underneath. Peter's read: Recipes/Drupal CMS is Drupal's real
shot at being a "WordPress killer," not by beating WordPress on plugins, but
by making Drupal's underlying robustness usable by non-developers.

### The Drupal AI module ecosystem (what Peter is actually building with)

The [AI module](https://www.drupal.org/project/ai) (12,676 sites in
production as of March 2026) is the umbrella; relevant submodules:

- **AI Automators** — field-level automation: populate/transform/enrich
  fields via chained prompts, web scraping, OCR, transcript generation.
  Reported 40-60% reductions in content-processing time for teams using it.
- **AI Assistants API + Chatbot** — backend for building configurable
  chat-based assistants (what reasoning strategy, what data they can access),
  frontend-agnostic. This is the piece directly relevant to the LWB chatbot
  work.
- **AI CKEditor** — inline AI (rewrite/translate/summarize/polish) in
  CKEditor 5, so AI assistance is part of everyday editing, not a separate
  tool.
- Connects to 48+ providers (OpenAI, Anthropic, Gemini, Mistral, self-hosted
  via Ollama) — not locked to one vendor.
- Separately, an **AI Agents module** exists for text-to-action agents that
  can directly manipulate Drupal config/content — part of Dries Buytaert's
  broader 2026 AI roadmap, which frames Drupal as a "governed control layer"
  for agentic AI workflows rather than just a content store.

### Where custom-built Drupal remains the right call

Peter's thesis, backed by market data: Drupal's target market has always
been the segment that can afford (and needs) custom development — that
hasn't changed, only the tooling around it has.

- Drupal is the [second-most-popular CMS among the top 100,000 sites
  globally](https://clutch.co/developers/drupal) (W3Techs, March 2026),
  behind only WordPress — but that ranking inverts at the low end, where
  WordPress and no-code builders dominate by sheer volume.
- The largest active buyer cohort in 2026 is mid-market enterprise —
  organizations roughly $5M-$500M in revenue commissioning real Drupal work
  without a Fortune 500 budget — plus the traditional strongholds: federal
  government, large universities, enterprise media.
- What custom Drupal work actually involves at this tier: custom module
  development, complex content architecture, multi-system integration,
  compliance requirements, granular permissions, multi-language publishing
  at scale, long-term platform stewardship — categorically different from
  what a Recipe or a WordPress plugin installs out of the box.
- Small businesses were never the Drupal market — they couldn't afford it
  before AI tooling existed and the low-cost alternatives (WordPress,
  Squarespace, Wix, and now AI site generators) have simply kept expanding
  to serve them. Nothing about the AI wave changes who needs Drupal; it
  changes who Drupal *also* wants to capture via Drupal CMS.

### Possible angle for the article

Not "Drupal vs WordPress" — instead: the CMS market is splitting into two
tiers faster than ever (AI-assisted no-code/low-code at the bottom, custom
enterprise builds at the top), and Drupal is one of the few platforms
trying to play in both simultaneously via Drupal CMS/Recipes at the bottom
and its existing architecture-level strengths at the top. Ground it in
Peter's own position: building custom Drupal at Kellett for enterprise
clients, while personally experimenting with the AI module/chatbot work on
LWB — a working example of the "AI at the edges, real architecture
underneath" pattern the article argues Drupal is well-placed to own.
