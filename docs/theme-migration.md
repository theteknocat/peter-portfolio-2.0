# Theme Migration Reference

Source: `../resume-and-portfolio-drupal/docroot/themes/custom/peter_portfolio`

A base theme lives alongside it at `../resume-and-portfolio-drupal/docroot/themes/custom/base_theme`
and is useful for boilerplate CSS reference if needed.

**Bootstrap 5 note:** The Drupal theme is based on Bootstrap 5. SCSS variables like `$primary-shade`
or font size values get compiled — Bootstrap's RFS system converts fixed rem font sizes into fluid
`calc()` expressions, for example. Always check the compiled
`../resume-and-portfolio-drupal/docroot/themes/custom/peter_portfolio/css/style.css` for the actual
CSS values rather than reading the SCSS source directly.

This document captures everything from the Drupal theme that needs to be ported.
Inner layout and content structure will be redesigned — this covers the base visual
system only: colour, typography, decorative elements, and key interaction patterns.

---

## Colour Palette

The theme uses a **green + gold on dark** palette. The planning doc mentions "gold/cyan"
but cyan (`#17a2b8`) barely appears in the Drupal theme — the actual accent is gold/yellow.
Decide whether to introduce more cyan in the rebuild or stick with green + gold.

```scss
// Translated to CSS custom properties:
--color-bg:         #403c34;          // body background ($gray-800)
--color-bg-dark:    rgb(21, 21, 29);  // $midnight — used for container inner backgrounds
--color-bg-glass:   rgba(21,21,29, 0.6); // $midnight-glass — container-deco inner bg

--color-primary:    #00a24e;          // green ($primary-shade)
--color-primary-light: ~#4ed68e;      // lighten(#00a24e, 37%) — headings, hover text
--color-primary-dark:  ~#003d1e;      // darken(#00a24e, 23%) — hover bg, footer bg

--color-accent:     rgb(255, 213, 43); // gold ($accent-shade) — links, nav, badges
--color-accent-light: ~#ffe98d;        // lighten(gold, 25%) — section titles, dividers
--color-accent-lighter: ~#ffdf6b;      // lighten(gold, 15%)

--color-text:       rgb(172, 160, 141); // $gray-300 — body text
--color-text-light: #f9f1e9;            // $gray-100
--color-border:     rgb(136, 125, 108); // $gray-400 — container borders, endcaps
```

**Semantic colours to define as tokens:**

- Link default: `--color-accent` (gold)
- Link hover: `--color-primary-light` (bright green)
- `h1–h6` default: `--color-primary-light` (bright teal-green — confirmed from screenshots)
- Section title (`h2.title`): `--color-primary-light` (bright teal-green — visually confirmed;
  the CSS says `$accent-light` but screenshots show teal-green, so the cascade overrides it)
- Nav link / tech badge / portfolio entry title: `--color-accent` (gold)
- Border/divider: `--color-accent-light` (content separators) or `--color-border` (structural)
- Header/footer border: `--color-primary`

---

## Typography

Three font families, all from Google Fonts:

| Role     | Family        | Usage                                                  |
| -------- | ------------- | ------------------------------------------------------ |
| Body     | **Open Sans** | All body copy, default text                            |
| Headings | **Righteous** | `h1–h6`, skill badge labels                            |
| Display  | **Audiowide** | Site name/logo, section `h2.title` decorative headings |

**Font decisions for the rebuild:**

- All three should be loaded (Google Fonts or self-hosted).
- Audiowide is distinctive and must be preserved for branding and section headings.
- Righteous for headings maintains the geometric feel.
- Open Sans for body is standard — could substitute a similar monospace-leaning option
  if you want more cyberpunk flavour, but the current site uses Open Sans for body.

---

## Body Background

The body background is a **repeating tile pattern** from `images/body-bg-dark.png`.
This is the primary "art-deco geometric" texture that defines the page feel.

The header uses a separate `images/green-marble-texture.jpg` repeating tile as a
`::before` pseudo-element (opacity 1, sits behind header content).

**Action needed:** Port both image files to `frontend/src/assets/`. The body background
tile should become a CSS custom property or applied at the `body` level in global styles.

---

## Decorative Element: `container-deco`

The most important structural decorative system in the theme. Used for the main content
area on inner pages, and for the skills paragraph block on the homepage.

### Structure (HTML)

```html
<div class="container-deco-outer">
  <div class="container-deco-inner">
    <div class="container-deco-top-endcap"></div>
    <!-- content here -->
    <div class="container-deco-bottom-endcap"></div>
  </div>
</div>
```

### What it looks like

- **Outer**: thin border (`$gray-400`, 1px), 7–10px padding, 7–9px margin
- **Inner**: semi-transparent dark glass background (`midnight` at 60% opacity),
  `backdrop-filter: blur(3px)`, same thin border, 15–30px padding
- **Endcaps**: absolutely-positioned elements whose `::before` and `::after`
  pseudo-elements each draw a small square (16–21px) at the four corners of the inner box.
  The squares sit just outside the corners, creating the "corner bracket" art-deco detail.
  Color: `$gray-400` (same as border).

### Vue implementation

Becomes a reusable `ContentCard.vue` component (already in the plan) that wraps content
in this double-border + corner-bracket structure. The endcap logic is pure CSS — the
HTML shape is just two empty divs with positioned pseudo-elements.

---

## Decorative Element: Section Dividers

Portfolio entries, job entries, and article list rows each have:

- `border-bottom: 1px solid $accent-light`
- `::before` / `::after` pseudo-elements: **11×11px squares** at `left: -10px` and
  `right: -10px`, aligned to the bottom of the border — creating small bracket corners
  at each end of the divider line.

`hr` elements use the same pattern. The last item in a list removes the border and hides
the squares.

**Vue implementation:** A CSS utility class or applied via `SectionHeading.vue` /
content list components. Simple enough to be a `--divider` modifier on a shared class.

---

## Decorative Element: Section Headings (`h2.title`)

Used for named page sections (e.g. "Portfolio", "Skills"). Distinctive style:

- Font: **Audiowide**
- Color: `$accent-light` (lightened gold) with `text-shadow: -2px -2px 0 black`
- A thin green underline centered below the text: `height: 1px; width: 50%;
  background: $primary-shade`
- Left and right of the text: outward-pointing **arrow/chevron decorations** made from
  CSS border triangles in `$primary-shade` green, with a slightly smaller inner triangle
  in `$primary-dark` to create a layered effect

**Vue implementation:** Becomes `SectionHeading.vue`. The arrows can be CSS-only using
`::before`/`::after` on the text span, matching the Drupal implementation.

---

## Skills Badges

The skills section uses a distinctive octagonal/beveled-corner shape for each skill tile:

```css
clip-path: polygon(10% 0%, 90% 0%, 100% 8%, 100% 92%, 90% 100%, 10% 100%, 0% 92%, 0% 8%);
```

- Large icon (5–6rem, Font Awesome) above label text (Righteous font, ~h3 size)
- Normal state: gold (`$accent-shade`)
- Hover state: green text (`$primary-light`), green background (`$primary-dark`),
  green border outline using a second `clip-path` pseudo-element
- **Hover animation:**
  - Container: `scale(1) rotateX(-10deg) rotateY(10deg) rotateZ(2deg)` with a
    bouncy cubic-bezier curve
  - Icon: `rotateY(720deg)` over 3s ease-out (full spin)

**Current technology list (14 items, hardcoded in Drupal template):**
Drupal, Laravel, PHP, MySQL/MariaDB, HTML5, CSS3, JavaScript, jQuery, VueJS,
Bootstrap, Agile/Scrum, Responsive Design, REST APIs, Symfony

**Action needed:** The new `TechBadge.vue` component must map technology slugs
(from YAML content) to icons. The planning doc lists new skills to add.
The icon library needs a decision — Font Awesome has the widest coverage for these,
but Simple Icons is an alternative for brand logos. See **Icon Library** section below.

---

## Scroll-in Animations

The `scroll-animations.css` file powers the skills tiles appearing on scroll
(`show-on-scroll` class with `slide-up/down/left/right` variants, each with a
randomised duration and delay).

**Vue implementation:** Can be recreated with the Intersection Observer API in a Vue
composable (`useScrollAnimation.ts` or similar), or a lightweight library.
This is a `nice-to-have` for the initial build — the core visual style works without it.

---

## Navigation / Header

### Structure

Logo (avatar `logo.jpg`, 40–50px, rounded 5px border `--color-primary`) + "Peter Epp"
text in **Audiowide** font, gold (`--color-accent-lighter`). Three nav links right-aligned:
**Portfolio, Articles, Job History**.

### Sticky + scroll behaviour

The header is always `position: fixed; top: 0; width: 100%; z-index: 50` (not conditional
on scroll — always sticky).

A `::before` pseudo-element carries the **marble texture** background:

```css
header::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url('/images/green-marble-texture.jpg');
  background-repeat: repeat;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
}
```

The header itself has:

```css
header {
  position: fixed; top: 0; width: 100%; z-index: 50;
  background-color: #002d16;             /* solid dark green at rest */
  border-bottom: 1px solid #00a24e;
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}
```

When a `.scrolled` class is applied to the header (via JS scroll listener):

```css
header.scrolled {
  background-color: rgba(0, 45, 22, 0.5);   /* semi-transparent */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
}
header.scrolled::before {
  opacity: 0.5;   /* $header-background-transparency-amount = 0.5 */
}
```

**Why `::before`?** `backdrop-filter` requires the element to have a (semi-)transparent
background. If the marble texture were the element's own background, the blur would
process pixels *behind* the texture — invisible. The `::before` carries the texture at
reduced opacity so the blur effect composites correctly.

**Vue implementation:** A `useScrolled.ts` composable watches `window.scroll` and
returns a reactive `isScrolled: Ref<boolean>`. The header binds `:class="{ scrolled: isScrolled }"`.

### Nav link styling

```css
/* default */
color: rgb(255, 213, 43);   /* --color-accent */
border: 1px solid transparent;
background: transparent;

/* hover / active */
color: #4ed68e;              /* --color-primary-light */
background-color: #002d16;  /* dark green */
border-color: #00a24e;      /* --color-primary */
```

---

## Footer

- `border-top: 1px solid var(--color-primary)`
- Background: `var(--color-primary-dark)` (dark green)
- Layout: copyright text left, three social icon links right

### Social links (in order)

| Icon                | Label              | URL                             |
| ------------------- | ------------------ | ------------------------------- |
| Drupal brand icon   | Drupal.org Profile | <https://drupal.org/u/teknocat> |
| LinkedIn brand icon | LinkedIn           | (user's LinkedIn)               |
| GitHub brand icon   | GitHub             | (user's GitHub)                 |

In the Drupal theme these are Font Awesome `fab` icons. In the Vue rebuild use
`@lucide/vue` for UI icons and Simple Icons for brand logos, or just link text if
icons aren't resolved yet.

---

## Inline Link Hover Style

Applied to all content area links (not buttons or nav links):

```css
border: 1px solid transparent;
display: inline-block;
/* on hover: */
background: $primary-dark;
border-color: $primary-shade;
```

This "box appears on hover" pattern is subtle but consistent across the site.
Needs to be applied globally in the Vue app's base styles.

---

## Icon Library

The Drupal theme uses **Font Awesome** (both `fab` brand icons and `fas` solid icons).
The skill badges and portfolio entry tech badges rely on FA icons exclusively.

**Decision needed before building `TechBadge.vue`:**

- **Font Awesome Free** — keep the familiar icon set, good brand coverage, well-known
- **Simple Icons** — SVG library purpose-built for brand/tech logos, more complete,
  used by many developer portfolios, no font file needed

The new skills to add (Claude, Docker, Python, Alpine.js, Tailscale, Cloudflare)
are all available in Simple Icons. PHP, Laravel, Vue, etc. are also there.
Font Awesome Free is missing some (e.g. Tailscale).

**Recommendation:** Switch to Simple Icons for tech badges; use a general icon set
(Lucide, Heroicons, or FA Free) for UI icons (chevrons, calendar, etc.).

---

## Easter Egg: Konami Code

`custom.js` triggers a Mario or Sonic sprite running across the bottom of the screen
when the Konami code is entered. The GIF files are in `images/`.

Worth porting. Vue implementation: global `keydown` listener in `App.vue` or a
`useKonamiCode.ts` composable.

**Action needed:** Copy `mario_running.gif` and `sonic-spinning.gif` to
`frontend/src/assets/`.

---

## Assets to Copy

From `images/` in the Drupal theme:

| File                       | Use                        | Priority     |
| -------------------------- | -------------------------- | ------------ |
| `body-bg-dark.png`         | Body background tile       | Must have    |
| `green-marble-texture.jpg` | Header background          | Must have    |
| `logo-rev.svg`             | Site logo (reversed/white) | Must have    |
| `logo.jpg`                 | Site logo                  | Must have    |
| `mario_running.gif`        | Konami Easter egg          | Nice to have |
| `sonic-spinning.gif`       | Konami Easter egg          | Nice to have |

---

## What Does NOT Need Porting

- `body-bg.png` (light version — dark-only in rebuild)
- `bootstrap.css` / Bootstrap itself (not using Bootstrap in Vue version)
- Email templates (`mail.scss`, `mimemail`)
- CKEditor styles
- Drupal-specific: breadcrumbs, tabs, form styles, accordion, pagination
- Carousel/slideshow (portfolio gallery will be redesigned)
- Drupal moderation UI styles
- jQuery dependency (not used in Vue)
