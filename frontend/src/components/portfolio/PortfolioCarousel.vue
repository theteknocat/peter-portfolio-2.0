<script setup lang="ts">
/**
 * Screenshot carousel for a portfolio item.
 *
 * Native CSS scroll-snap strip — swipe / trackpad / keyboard scrolling come
 * for free. Prev/Next buttons and dot indicators drive it programmatically.
 * No carousel library.
 */
import { ref } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import type { PortfolioImage } from '@/types/portfolio'

const props = defineProps<{
  images: PortfolioImage[]
  slug: string
}>()

/** The scrollable track element — bound via the matching `ref="track"`. */
const track = ref<HTMLElement | null>(null)

/** Index of the slide currently snapped into view. */
const active = ref(0)

/** Build the served URL for a screenshot from its bare filename. */
function imageUrl(src: string): string {
  return `/images/content/portfolio/${props.slug}/${src}`
}

/** Smooth-scroll to a slide by index, clamped to the valid range. */
function scrollToIndex(i: number): void {
  const el = track.value
  if (!el) return
  const clamped = Math.max(0, Math.min(i, props.images.length - 1))
  el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
}

/** Keep `active` in sync as the user scrolls/swipes the track directly. */
function onScroll(): void {
  const el = track.value
  if (!el) return
  active.value = Math.round(el.scrollLeft / el.clientWidth)
}
</script>

<template>
  <div class="carousel">
    <div ref="track" class="carousel-track" @scroll="onScroll">
      <div v-for="(img, i) in images" :key="i" class="carousel-slide">
        <img :src="imageUrl(img.src)" :alt="img.alt" loading="lazy" />
      </div>
    </div>

    <template v-if="images.length > 1">
      <button
        class="btn btn-icon border-jitter carousel-nav carousel-nav--prev"
        :disabled="active === 0"
        aria-label="Previous screenshot"
        @click="scrollToIndex(active - 1)"
      >
        <ChevronLeft :size="20" />
      </button>
      <button
        class="btn btn-icon border-jitter carousel-nav carousel-nav--next"
        :disabled="active === images.length - 1"
        aria-label="Next screenshot"
        @click="scrollToIndex(active + 1)"
      >
        <ChevronRight :size="20" />
      </button>

      <div class="carousel-dots">
        <button
          v-for="(img, i) in images"
          :key="i"
          class="carousel-dot border-jitter"
          :class="{ 'carousel-dot--active': i === active }"
          :aria-label="`Go to screenshot ${i + 1}`"
          :aria-current="i === active"
          @click="scrollToIndex(i)"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.carousel {
  position: relative;
  margin: 0 0 1.5rem;
}

.carousel-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Firefox */
  border-radius: 0.375rem;
  background: rgb(0 0 0 / 0.35);
}

.carousel-track::-webkit-scrollbar {
  display: none; /* Chromium/Safari */
}

.carousel-track:focus-visible {
  outline: 1px solid var(--color-primary-light);
  outline-offset: 3px;
}

.carousel-slide {
  flex: 0 0 100%;
  scroll-snap-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(16rem, 50vh, 32rem);
}

.carousel-slide img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Circular look + hover come from .btn / .btn-icon. Position and a dark disc
   for legibility over bright screenshots are the carousel-specific extras. */
.carousel-nav {
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  background: rgb(0 0 0 / 0.45);
  transition: background 0.15s, opacity 0.15s;
}

.carousel-nav:hover {
  background: rgb(0 0 0 / 0.7);
}

.carousel-nav:disabled {
  opacity: 0.3;
  cursor: default;
}

.carousel-nav--prev {
  left: 0.5rem;
}

.carousel-nav--next {
  right: 0.5rem;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 0.85rem;
  margin-top: 0.75rem;
}

.carousel-dot {
  width: 0.85rem;
  height: 0.85rem;
  rotate: 45deg;
  background: transparent;
  border: 1px solid var(--color-accent);
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s, border-color 0.15s;
}

.carousel-dot:hover,
.carousel-dot:focus-visible {
  opacity: 1;
  border-color: var(--color-primary-light);
}

.carousel-dot:focus-visible {
  outline: none;
}

.carousel-dot--active {
  opacity: 1;
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.carousel-dot--active:hover,
.carousel-dot--active:focus-visible {
  background: var(--color-primary-light);
}
</style>
