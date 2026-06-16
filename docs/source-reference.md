# Source Reference: Drupal Theme CSS & HTML

Extracted from `../resume-and-portfolio-drupal/docroot/themes/custom/peter_portfolio`.
Use this to port each component without re-reading the source theme.

Screenshots taken 2026-06-12 from the running DDEV instance (`peter-epp.ddev.site:8443`).

---

## Base Typography & Font Sizes

From `base_theme/scss/typography.scss` (peter_portfolio inherits this):

- **`$font-size-base: 1.1rem`** — not 1rem. The whole theme scales from this.
- **`$line-height-base: 1.8`**
- Heading sizes (base × multiplier): h1/h2: 2.75rem, h3: 2.2rem, h4: 1.925rem, h5: 1.65rem, h6: 1.375rem
- `font-weight-headings: normal` (not bold)
- Nav links: `1.1rem` (inherit from body)
- Navbar brand: `1.5rem` (2rem on `sm+`) — explicit override in `custom.scss`
- Logo height: `$site-logo-height: 50px`

Corrected token values (from compiled SCSS, not estimates):

- `--color-primary-light`: `#60ffac` — `lighten(#00a24e, 37%)` compiled output
- `--color-primary-dark`: `#002d16` — `darken(#00a24e, 23%)` compiled output (confirmed from header/nav hover bg in compiled CSS)
- `--color-accent-light`: `#ffeeab` — `$accent-light` compiled output (`rgb(255, 238, 171)`)
- Footer copyright uses `$footer-color: $accent-lighter` = `--color-accent-lighter` (#ffdf6b)
- Footer links use `$footer-link-color: $accent-shade` = `--color-accent`

---

## Header (`AppHeader` + `AppNav`)

### SCSS source (`scss/custom.scss` lines 160–228)

```scss
#header {
  border-bottom: 1px solid $primary-shade;        // --color-primary
  &:not(.affix) { position: relative; }

  // Marble texture sits in ::before so backdrop-filter works on the element bg
  &:before {
    content: " ";
    position: absolute;
    left: 0; top: 0; right: 0; bottom: 0;
    background-image: url(../images/green-marble-texture.jpg);
    background-repeat: repeat;
    opacity: 1;
    transition: all 0.2s ease-in-out;
  }

  // When body has .scrolled, fade the texture and add blur
  .scrolled &.semi-transparent-on-scroll {
    &:before { opacity: 0.5; }  // 1 - $header-background-transparency-amount (0.5)
  }

  .block-menu .nav .nav-link {
    border: 1px solid transparent;
    &:hover, &.show, &:active, &.active { border-color: $primary-shade; }
  }
}

// Logo / branding
#navbar-main .site-branding {
  font-family: $font-family-audiowide;
  .navbar-brand {
    color: $accent-lighter;              // --color-accent-lighter
    font-size: 1.5rem;                   // 2rem on sm+
    padding: 0 10px;
    border: 1px solid transparent;
    &:hover {
      color: $primary-light;
      background-color: $primary-dark;
      border-color: $primary-shade;
    }
    .site-logo {
      border: 1px solid $primary-shade;  // --color-primary
      border-radius: 5px;
      width: 40px;                       // 50px on sm+
    }
  }
}
```

### Compiled scroll behaviour (`css/style.css` lines 16963–16976)

```css
/* base */
#header {
  background-color: #002d16;
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

/* when body.scrolled */
.scrolled #header.semi-transparent-on-scroll {
  background-color: rgba(0, 45, 22, 0.5);
}
.scrolled #header.semi-transparent-on-scroll:not(.has-offcanvas-menu) {
  -webkit-backdrop-filter: blur(20px);
          backdrop-filter: blur(20px);
}
.scrolled #header.floating, .scrolled #header.affix {
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
}
```

### Nav link colours (`css/style.css` lines 17014–17031)

```css
.nav .nav-link          { color: rgb(255, 213, 43); background: transparent; }
.nav .nav-link:hover,
.nav .nav-link.active   { color: #60ffac; background-color: #002d16; }
```

### Vue implementation notes

- Header is always `position: fixed; top: 0; width: 100%; z-index: 50`.
- In Drupal the `.scrolled` class lives on `<body>`. In Vue it's a class on `<header>`
  driven by a `useScrolled` composable (scroll listener → `ref<boolean>`).
- `green-marble-texture.jpg` is already in `frontend/public/images/`.

---

## Section Heading (`SectionHeading` component)

### SCSS source (`scss/custom.scss` lines 61–128)

```scss
h2.title {
  position: relative;
  color: $accent-light;                     // --color-accent-light
  text-align: center;
  text-shadow: -2px -2px 0 black;
  font-family: $font-family-audiowide;
  font-weight: normal;
  width: fit-content;

  .title-text {
    position: relative;
    z-index: 1;
    display: block;
    padding: 20px 0 10px;

    // Underline bar centered below text
    .title-inner {
      display: block;
      position: relative;
      &:after {
        content: "";
        position: absolute;
        bottom: -5px; left: 50%;
        transform: translateX(-50%);
        height: 1px; width: 50%;
        background: $primary-shade;         // --color-primary
      }
    }

    // Outer arrows (larger, green) — point away from centre
    &:before {
      content: ""; position: absolute;
      left: -60px; top: 55%; transform: translateY(-50%);
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-right: 50px solid $primary-shade;
    }
    &:after {
      content: ""; position: absolute;
      right: -60px; top: 55%; transform: translateY(-50%);
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-left: 50px solid $primary-shade;
    }
  }

  // Inner arrows (smaller, dark green) overlay outer — layered effect
  &:before {
    content: ""; position: absolute; z-index: 5;
    left: -55px; top: 55%; transform: translateY(-50%);
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 43px solid $primary-dark;
  }
  &:after {
    content: ""; position: absolute; z-index: 5;
    right: -55px; top: 55%; transform: translateY(-50%);
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-left: 43px solid $primary-dark;
  }
}
```

### HTML structure (rendered output)

```html
<h2 class="title">
  <span class="title-text">
    <span class="title-inner">Technical Skills</span>
  </span>
</h2>
```

---

## Content Card (`ContentCard` component)

### SCSS source (`scss/custom.scss` lines 250–328)

```scss
.container-deco-outer {
  padding: 7px;           // 10px on lg+
  border: 1px solid $gray-400;   // --color-border
  margin: 7px;            // 9px on lg+

  .container-deco-inner {
    position: relative;
    background: $midnight-glass;         // rgba(21,21,29, 0.6) = --color-bg-glass
    backdrop-filter: blur(3px);
    border: 1px solid $gray-400;
    padding: 15px;        // 20px on md+, 30px on lg+

    // Top-left, top-right corners
    .container-deco-top-endcap {
      position: absolute; height: 0; left: 0; right: 0; top: 0;
      &:before {          // top-left square
        content: ""; display: block; position: absolute;
        width: 16px; height: 16px;   // 21px on lg+
        border: 1px solid $gray-400;
        left: -16px; top: -16px;     // -21px on lg+
      }
      &:after {           // top-right square
        content: ""; display: block; position: absolute;
        width: 16px; height: 16px;
        border: 1px solid $gray-400;
        right: -16px; top: -16px;
      }
    }

    // Bottom-left, bottom-right corners (mirror of top)
    .container-deco-bottom-endcap {
      position: absolute; height: 0; left: 0; right: 0; bottom: 0;
      &:before { left: -16px; bottom: -16px; /* same width/height/border */ }
      &:after  { right: -16px; bottom: -16px; }
    }
  }
}
```

### HTML structure (from `paragraph--skills.html.twig`)

```html
<div class="container-deco-outer">
  <div class="container-deco-inner">
    <div class="container-deco-top-endcap"></div>
    <!-- slot content here -->
    <div class="container-deco-bottom-endcap"></div>
  </div>
</div>
```

---

## Section Dividers (portfolio entries, job entries, article rows)

### SCSS source (`scss/custom.scss` lines 338–389)

```scss
// The row itself
.paragraph--type--portfolio-entry,
.paragraph--type--job-entry,
.view-articles .views-row {
  padding-bottom: 2rem;
  margin: 0 0 2rem;
  border-bottom: 1px solid $accent-light;  // --color-accent-light
}

// Corner squares at either end of the divider line
.paragraph--type--portfolio-entry,
.paragraph--type--job-entry,
.view-articles .views-row,
hr {
  position: relative; overflow: visible;
  &:before, &:after {
    content: " "; position: absolute; display: block;
    width: 11px; height: 11px;
    border: 1px solid $accent-light;
  }
  &:before { left: -10px;  }
  &:after  { right: -10px; }
}

// Squares sit at bottom of the border
.paragraph--type--portfolio-entry,
.paragraph--type--job-entry,
.view-articles .views-row {
  &:before, &:after { bottom: -6px; }
}

hr { &:before, &:after { bottom: -5px; } }

// Last item removes border and hides squares
.field__item:last-child .paragraph--type--portfolio-entry,
.field__item:last-child .paragraph--type--job-entry,
.view-articles .views-row:last-child {
  border-bottom: none;
  &:before, &:after { display: none; }
}
```

---

## Skills Badge (`TechBadge` component)

### CSS source (`css/style.css` lines 20419–20523)

```css
.skill-item {
  text-align: center;
  margin-bottom: 0.9375rem;
  perspective: 400px;
}

/* The badge tile */
.skill-item .link-with-icon {
  display: block; position: relative;
  width: 100%; height: 100%;
  padding: 0.625rem;
  perspective: 200px;
  transform: scale(0.8) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  transition: transform 0.2s ease-in-out, color 0.2s ease-in-out;
  clip-path: polygon(10% 0%, 90% 0%, 100% 8%, 100% 92%, 90% 100%, 10% 100%, 0% 92%, 0% 8%);
  color: rgb(255, 213, 43);   /* gold */
}

/* Outline border via ::before (same clip-path, 1px inset) */
.skill-item .link-with-icon:before {
  content: ""; display: block; position: absolute; z-index: -1;
  left: -1px; top: -1px; right: -1px; bottom: -1px;
  background-color: transparent;
  clip-path: polygon(10% 0%, 90% 0%, 100% 8%, 100% 92%, 90% 100%, 10% 100%,
                     10% 99%, 90% 99%, 99% 92%, 99% 8%, 90% 1%, 10% 1%,
                     1% 8%, 1% 92%, 10% 99%, 10% 100%, 0% 92%, 0% 8%);
}

/* Icon span */
.skill-item .link-with-icon span.icon {
  display: block; margin-bottom: 0.3125rem;
  font-size: 5rem;   /* 6rem on lg+ */
  transform: rotateY(0);
}

/* Label span */
.skill-item .link-with-icon span.link-text {
  font-family: "Righteous", sans-serif;
  font-size: 2.2rem;
}

/* Hover state */
.skill-item .link-with-icon:hover {
  color: #60ffac;                          /* --color-primary-light */
  background: #002d16;
  transform: scale(1) rotateX(-10deg) rotateY(10deg) rotateZ(2deg);
  transition: transform 0.5s cubic-bezier(0.175, 3.885, 0.2, 1.275),
              color 0.2s ease-in-out;
}
.skill-item .link-with-icon:hover:before {
  background-color: #00a24e;              /* --color-primary — shows the border */
}
.skill-item .link-with-icon:hover span.icon {
  transform: rotateY(720deg);             /* full 2-rotation spin */
  transition: transform 3s ease-out;
}
```

### HTML structure (from `paragraph--portfolio-entry.html.twig`, short variant)

```html
<!-- Skills list grid: row-cols-2 row-cols-md-4 row-cols-xl-5 -->
<div class="skills-list field__items row row-cols-2 row-cols-md-4 row-cols-xl-5 gx-0">
  <div class="show-on-scroll slide-up skill-item field__item d-flex align-items-stretch justify-content-center">
    <a href="https://drupal.org" class="link-with-icon" title="Drupal">
      <span class="icon"><i class="fab fa-drupal"></i></span>
      <span class="link-text">Drupal</span>
    </a>
  </div>
  <!-- ... -->
</div>
```

### Technology → FA icon mapping (from Twig template)

| ID  | Technology        | FA icon class          |
| --- | ----------------- | ---------------------- |
| 1   | Drupal            | `fab fa-drupal`        |
| 2   | Laravel           | `fab fa-laravel`       |
| 3   | PHP               | `fab fa-php`           |
| 4   | MySQL / MariaDB   | `fas fa-database`      |
| 5   | HTML5             | `fab fa-html5`         |
| 6   | CSS3              | `fab fa-css3-alt`      |
| 7   | Javascript        | `fab fa-js-square`     |
| 8   | jQuery            | `fab fa-js-square`     |
| 9   | VueJS             | `fab fa-vuejs`         |
| 10  | Bootstrap         | `fas fa-th`            |
| 11  | Agile / Scrum     | `fas fa-sync-alt`      |
| 12  | Responsive Design | `fas fa-mobile-alt`    |
| 13  | REST APIs         | `fas fa-plug`          |
| 14  | Symfony           | `fa-brands fa-symfony` |

**Note:** The Vue rebuild uses Simple Icons (not FA) for brand logos. This table is for
reference only — the mapping will be rebuilt in `TechBadge.vue` using Simple Icons SVGs.

---

## Portfolio Entry (`PortfolioEntry` component)

### HTML structure (from `paragraph--portfolio-entry.html.twig`)

```html
<div class="paragraph--type--portfolio-entry">
  <div class="portfolio-header">
    <h4 class="project-title d-md-flex align-items-md-center justify-content-md-between">
      <span><i class="fas fa-project-diagram"></i> Project Title</span>
      <span class="project-dates"><i class="fas fa-calendar-alt"></i> Date Range</span>
    </h4>
    <h5 class="link-and-skills d-md-flex justify-content-md-between">
      <span class="skills d-flex flex-wrap align-items-center">
        <!-- Short tech badge icons (icon only, no label) -->
        <a href="..." class="link-with-icon"><span class="icon"><i class="fab fa-drupal"></i></span></a>
      </span>
      <span class="project-link"><!-- URL field --></span>
    </h5>
    <!-- Expand/collapse toggle -->
    <a class="item-toggle btn btn-outline-primary btn-sm collapsed"
       data-bs-toggle="collapse" data-bs-target="#portfolio-content-{id}">
      Details <i class="fas fa-angle-down"></i>
    </a>
  </div>
  <div id="portfolio-content-{id}" class="portfolio-content collapse">
    <div class="portfolio-content-inner">
      <!-- Tabs: Description / Image Gallery -->
      <ul class="nav nav-tabs my-2">...</ul>
      <div class="tab-content">
        <div class="tab-pane show active pt-3">
          <div class="portfolio-description row">
            <div class="col-lg-8"><!-- description --></div>
            <div class="col-lg-4">
              <h4>Technologies Used</h4>
              <ul class="technologies-text-links">
                <!-- Long tech badges (icon + label) -->
                <li><a class="link-with-icon"><span class="icon me-2">...</span><span class="link-text">Drupal</span></a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Banner / Hero Section

### CSS source (`css/style.css` lines 20525–20529)

```css
.banner-content-inner {
  background-color: rgba(0, 45, 22, 0.8);
  backdrop-filter: blur(20px) saturate(1) brightness(2) grayscale(0.5);
  border: 1px solid #00a24e;   /* --color-primary */
}
```

---

## Footer (`AppFooter` component)

### SCSS source (`scss/custom.scss` line 391)

```scss
.site-footer {
  border-top: 1px solid $primary-shade;   // --color-primary
}
```

### Social media icon hover (`scss/custom.scss` lines 37–41)

```scss
a.social-media-icon {
  padding: 2px 6px;
  &:hover { transform: scale(1.3); }
}
```

### Social links (from live HTML, footer region)

| Icon class        | Label      | URL                             |
| ----------------- | ---------- | ------------------------------- |
| `fab fa-drupal`   | Drupal.org | `https://drupal.org/u/teknocat` |
| `fab fa-linkedin` | LinkedIn   | Peter's LinkedIn profile        |
| `fab fa-github`   | GitHub     | Peter's GitHub profile          |

### Copyright block HTML (from `block--pepp-copyright-block.html.twig`)

```html
<div class="content d-flex gap-2">
  <div class="copyright-pre-text">Copyright</div>
  <div class="branded-copyright">
    <!-- ::before pseudo adds © symbol -->
    <div class="copyright-year">2026</div>
  </div>
  <div class="copyright-post-text">Peter Epp</div>
</div>
```

In Vue: `computed(() => new Date().getFullYear())` for the year.

---

## Inline Link Hover (global base style)

```css
/* All content links (not buttons, not nav) */
a:not(.btn, .nav-link) {
  border: 1px solid transparent;
  display: inline-block;
}
a:not(.btn, .nav-link):hover {
  background: #002d16;          /* --color-primary-dark (Drupal uses #002d16) */
  border-color: #00a24e;        /* --color-primary */
}
```

✅ Implemented in `links.css` on `a:not(.btn, .link-poly)`. Values confirmed. Also added flanking chevron pseudo-elements that slide outward on hover.

---

## Assets Already Ported

| File                       | Location in Vue project              | Notes                                           |
| -------------------------- | ------------------------------------ | ----------------------------------------------- |
| `body-bg-dark.png`         | `frontend/public/images/`            | Ported but superseded — see below               |
| `body-bg-tile.svg`         | `frontend/public/images/`            | Replaces PNG; clean vector, same diamond pattern |
| `green-marble-texture.jpg` | `frontend/public/images/`            | Used in AppHeader `::before`                    |
| `logo.jpg`                 | `frontend/src/assets/logo.jpg`       |                                                 |

`body-bg-dark.png` was ported initially but replaced by a hand-crafted `body-bg-tile.svg` — the SVG is smaller, scales perfectly, and makes the tile geometry explicit for the streak animation system.

Still needed: `mario_running.gif`, `sonic-spinning.gif` (for Konami Easter egg — low priority).
