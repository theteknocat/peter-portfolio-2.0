<script setup lang="ts">
/**
 * Decorated content container. Provides the double-border + corner bracket
 * treatment used on all main content areas. Also the target element for
 * 3D page transition transforms.
 */
defineProps<{
  /** Optional extra classes to pass through to the card element */
  class?: string
}>()
</script>

<template>
  <div v-specular-highlight class="content-card">
    <div class="card-endcap top"></div>
    <div class="content-card-inner">
      <slot />
    </div>
    <div class="card-endcap bottom"></div>
  </div>
</template>

<style scoped>
.content-card {
  position: relative;
  background-color: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  outline: 1px solid var(--color-border);
  outline-offset: 8px;
  margin: 16px;
  /* 3D transforms will be applied to this element during page transitions */
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.content-card .content-card-inner {
  padding: 2rem;
}

/* Placeholder corner brackets — will be replaced with endcap divs matching
   the original: four 16×16px full-border squares at each corner. */
.content-card .card-endcap {
  position: relative;
}
.content-card .card-endcap::before,
.content-card .card-endcap::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 1px solid var(--color-border);
  pointer-events: none;
}
.content-card .card-endcap::before {
  left: -16px;
}
.content-card .card-endcap::after {
  left: auto;
  right: -16px;
}
.content-card .card-endcap.top::before,
.content-card .card-endcap.top::after {
  top: -16px;
}
.content-card .card-endcap.bottom::before,
.content-card .card-endcap.bottom::after {
  bottom: -16px;
}
</style>
