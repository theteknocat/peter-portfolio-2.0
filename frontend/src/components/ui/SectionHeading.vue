<script setup lang="ts">
/**
 * Decorated page-level heading. Always renders as h1. Uses layered CSS
 * pseudo-elements on the h1 and inner span to produce the chevron arrows
 * flanking the title, matching the original theme's h2.title pattern.
 */
</script>

<template>
  <h1 class="section-heading">
    <span class="heading-text">
      <span class="heading-inner">
        <slot />
      </span>
    </span>
  </h1>
</template>

<style scoped>
.section-heading {
  position: relative;
  color: var(--color-accent-light);
  text-align: center;
  text-shadow: -2px -2px 0 black;
  font-family: var(--font-display);
  font-weight: normal;
  width: fit-content;
  margin-inline: auto;
  /* Inner arrows (smaller, dark) — overlay the outer green arrows */
}

/* Inner left arrow */
.section-heading::before {
  content: '';
  position: absolute;
  z-index: 5;
  left: -55px;
  top: 55%;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 43px solid var(--color-primary-dark);
}

/* Inner right arrow */
.section-heading::after {
  content: '';
  position: absolute;
  z-index: 5;
  right: -55px;
  top: 55%;
  transform: translateY(-50%);
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 43px solid var(--color-primary-dark);
}

.heading-text {
  position: relative;
  z-index: 1;
  display: block;
  padding: 20px 0 10px;
  /* Outer arrows (larger, green) — sit behind the dark inner arrows */
}

/* Outer left arrow */
.heading-text::before {
  content: '';
  position: absolute;
  left: -60px;
  top: 55%;
  transform: translateY(-50%);
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 50px solid var(--color-primary);
}

/* Outer right arrow */
.heading-text::after {
  content: '';
  position: absolute;
  right: -60px;
  top: 55%;
  transform: translateY(-50%);
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 50px solid var(--color-primary);
}

.heading-inner {
  display: block;
  position: relative;
}

/* Underline bar centred beneath the text */
.heading-inner::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  height: 1px;
  width: 50%;
  background: var(--color-primary);
}
</style>
