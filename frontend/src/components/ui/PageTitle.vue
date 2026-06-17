<script setup lang="ts">
/**
 * Decorated page-level heading. Flanking arrows are inline SVG polygons —
 * cleaner than the previous layered CSS border-trick pseudo-elements.
 */
</script>

<template>
  <h1 class="page-title">
    <svg class="heading-arrow" viewBox="0 0 50 24" aria-hidden="true">
      <polygon points="50,0 0,12 50,24" />
    </svg>
    <span class="heading-inner">
      <slot />
    </span>
    <svg class="heading-arrow" viewBox="0 0 50 24" aria-hidden="true">
      <polygon points="0,0 50,12 0,24" />
    </svg>
  </h1>
</template>

<style scoped>
.page-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-accent-light);
  text-align: center;
  text-shadow: -2px -2px 0 black;
  font-family: var(--font-display);
  font-weight: normal;
  width: fit-content;
  margin-block: 1rem;
  margin-inline: auto;
}

.heading-arrow {
  width: 50px;
  height: 24px;
  flex-shrink: 0;
}

/* CSS properties (not SVG attributes) so CSS custom properties resolve correctly */
.heading-arrow polygon {
  fill: var(--color-primary-dark);
  stroke: var(--color-primary);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.heading-inner {
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
