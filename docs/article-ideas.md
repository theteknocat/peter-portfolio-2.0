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
