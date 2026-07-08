<script setup lang="ts">
/**
 * Screenshot carousel for a portfolio item.
 *
 * Native CSS scroll-snap strip — swipe / trackpad / keyboard scrolling come
 * for free. Prev/Next buttons and dot indicators drive it programmatically.
 * No carousel library.
 */
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from '@lucide/vue'
import type { PortfolioImage, PortfolioSlideEntry } from '@/types/portfolio'

const props = defineProps<{
  images: PortfolioSlideEntry[]
  slug: string
}>()

/** The scrollable track element — bound via the matching `ref="track"`. */
const track = ref<HTMLElement | null>(null)

/** Index of the slide currently snapped into view. */
const active = ref(0)

/**
 * One vertically-scrollable sub-track per slide (mobile-only paging through
 * a group's images — desktop shows the group side by side instead, so these
 * never scroll there). Indexed to match `slides`.
 */
const subTracks = ref<(HTMLElement | null)[]>([])

/** Index of the currently shown image within the active slide's group. */
const subIndex = ref(0)

/** Whether the caption is expanded (tap-toggled — sticky on touch). */
const captionExpanded = ref(false)

/** Hover/focus also expand the caption, independent of the tap toggle. */
const captionHovered = ref(false)
const captionFocused = ref(false)

/* Real pointer devices only — on touch, :hover-equivalent state sticks
   until an unrelated pointer-leave event, fighting the tap-to-toggle. */
const canHover = typeof matchMedia !== 'undefined' && matchMedia('(hover: hover)').matches

/** The caption `<button>` — measured to drive the height transition. */
const captionEl = ref<HTMLElement | null>(null)

/** Pixel height of one line, and of the full (wrapped) caption text. */
const captionCollapsedHeight = ref(0)
const captionFullHeight = ref(0)

/** Whether the caption text is taller than one line — shows the overflow marker. */
const captionOverflows = computed(() => captionFullHeight.value > captionCollapsedHeight.value + 1)

/* Nothing to reveal when the caption fits on one line — hover/tap/focus
   should be inert rather than expanding to an identical height. */
const captionVisible = computed(
  () =>
    captionOverflows.value &&
    (captionExpanded.value || captionFocused.value || (canHover && captionHovered.value))
)

/** Re-measure the caption's real height so the transition animates to exact values, not a guessed cap. */
function measureCaption(): void {
  const el = captionEl.value
  if (!el) return
  captionCollapsedHeight.value = parseFloat(getComputedStyle(el).lineHeight)
  captionFullHeight.value = el.scrollHeight
}

/* ResizeObserver (not just mount/slide-change) catches width changes from the
   modal's open transition and breakpoint/orientation changes — a one-shot
   measure on mount was reading the wrong width before those settled. */
let captionResizeObserver: ResizeObserver | null = null

watch(
  captionEl,
  (el) => {
    captionResizeObserver?.disconnect()
    captionResizeObserver = null
    if (!el) return
    measureCaption()
    captionResizeObserver = new ResizeObserver(measureCaption)
    captionResizeObserver.observe(el)
  },
  { immediate: true }
)

onUnmounted(() => captionResizeObserver?.disconnect())

watch(active, (i) => {
  subIndex.value = 0
  captionExpanded.value = false
  subTracks.value[i]?.scrollTo({ top: 0 })
  nextTick(measureCaption)
})

/** Toggle the caption between single-line and expanded/wrapped (tap-to-stick). */
function toggleCaption(): void {
  captionExpanded.value = !captionExpanded.value
  /* Tapping focuses the button too, and focus alone keeps it expanded — without
     this, collapsing only actually happened on a later, unrelated blur. */
  if (!captionExpanded.value) captionEl.value?.blur()
}

/** Collapse a tap-stuck caption when the user taps/clicks anywhere else. */
function onDocumentClick(e: MouseEvent): void {
  if (!captionEl.value?.contains(e.target as Node)) captionExpanded.value = false
}

watch(captionExpanded, (expanded) => {
  if (expanded) document.addEventListener('click', onDocumentClick)
  else document.removeEventListener('click', onDocumentClick)
})

onUnmounted(() => document.removeEventListener('click', onDocumentClick))

/** Move to the previous/next image within the active slide's group, no wrap. */
function moveSub(delta: number): void {
  const el = subTracks.value[active.value]
  if (!el) return
  const count = slides.value[active.value]?.images.length ?? 1
  const next = Math.max(0, Math.min(subIndex.value + delta, count - 1))
  el.scrollTo({ top: next * el.clientHeight, behavior: 'smooth' })
}

/** Keep `subIndex` in sync as the user swipes a slide's sub-track directly. */
function onSubScroll(i: number, e: Event): void {
  if (i !== active.value) return
  const el = e.target as HTMLElement
  subIndex.value = Math.round(el.scrollTop / el.clientHeight)
}

interface NormalizedSlide {
  images: PortfolioImage[]
  caption?: string
}

/** Flattens a slide entry (single image or group) to a common render shape. */
function normalizeSlide(entry: PortfolioSlideEntry): NormalizedSlide {
  if ('images' in entry) return { images: entry.images, caption: entry.caption }
  return { images: [entry], caption: entry.caption === true ? entry.alt : entry.caption }
}

const slides = computed(() => props.images.map(normalizeSlide))

/** Build the served URL for a screenshot from its bare filename. */
function imageUrl(src: string): string {
  return `/images/content/portfolio/${props.slug}/${src}`
}

/** Smooth-scroll to a slide by index, clamped to the valid range. */
function scrollToIndex(i: number): void {
  const el = track.value
  if (!el) return
  if (i < 0) {
    i = slides.value.length;
  } else if (i > (slides.value.length - 1)) {
    i = 0;
  }
  const clamped = Math.max(0, Math.min(i, slides.value.length - 1))
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
      <div v-for="(slide, i) in slides" :key="i" class="carousel-slide">
        <div
          class="carousel-slide-images"
          :ref="(el) => { subTracks[i] = el as HTMLElement | null }"
          @scroll="onSubScroll(i, $event)"
        >
          <img v-for="(img, gi) in slide.images" :key="gi" :src="imageUrl(img.src)" :alt="img.alt" loading="lazy" />
        </div>
      </div>
    </div>

    <div v-if="(slides[active]?.images.length ?? 1) > 1" class="carousel-subnav">
      <button
        :disabled="subIndex === 0"
        class="btn btn-icon border-jitter carousel-nav carousel-nav--up"
        aria-label="Previous image in this screenshot"
        @click="moveSub(-1)"
      >
        <ChevronUp :size="20" />
      </button>
      <button
        :disabled="subIndex >= (slides[active]?.images.length ?? 1) - 1"
        class="btn btn-icon border-jitter carousel-nav carousel-nav--down"
        aria-label="Next image in this screenshot"
        @click="moveSub(1)"
      >
        <ChevronDown :size="20" />
      </button>
    </div>

    <div v-if="slides.length > 1 || slides[active]?.caption" class="carousel-bar">
      <button
        ref="captionEl"
        type="button"
        class="carousel-caption"
        :class="{ 'carousel-caption--has-more': captionOverflows && !captionVisible }"
        :style="{ height: (captionVisible ? captionFullHeight : captionCollapsedHeight) + 'px' }"
        @click="toggleCaption"
        @mouseenter="captionHovered = true"
        @mouseleave="captionHovered = false"
        @focus="captionFocused = true"
        @blur="captionFocused = false"
      >
        {{ slides[active]?.caption }}
        <ChevronDown
          v-if="captionOverflows && !captionVisible"
          :size="14"
          class="carousel-caption-more"
          aria-hidden="true"
        />
      </button>
      <div v-if="slides.length > 1" class="carousel-bar-nav">
        <span class="carousel-counter">{{ active + 1 }} / {{ slides.length }}</span>
        <button
          class="btn btn-icon border-jitter carousel-nav"
          aria-label="Previous screenshot"
          @click="scrollToIndex(active - 1)"
        >
          <ChevronLeft :size="18" />
        </button>
        <button
          class="btn btn-icon border-jitter carousel-nav"
          aria-label="Next screenshot"
          @click="scrollToIndex(active + 1)"
        >
          <ChevronRight :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.carousel {
  position: relative;
  margin: 0 0 1.5rem;
  /* Reserves room for the collapsed caption bar below the image, so it
     hangs fully off the bottom by default instead of overlapping it. */
  padding-bottom: 2.75rem;
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
  position: relative;
  flex: 0 0 100%;
  scroll-snap-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
}

/* Mobile default: a vertical scroll-snap track — up/down nav pages through a
   group's images with real motion, instead of side-by-side (which shrinks
   grouped images to illegible slivers on narrow viewports). */
.carousel-slide-images {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none; /* Firefox */
  width: 100%;
  height: 100%;
}

.carousel-slide-images::-webkit-scrollbar {
  display: none; /* Chromium/Safari */
}

.carousel-slide-images img {
  flex: 0 0 100%;
  scroll-snap-align: center;
  max-width: 100%;
  height: 100%;
  object-fit: contain;
}

@media (width >= theme(--breakpoint-md)) {
  .carousel-slide {
    aspect-ratio: 16 / 10;
    max-height: 34rem;
  }

  .carousel-slide-images {
    flex-direction: row;
    overflow: visible;
    scroll-snap-type: none;
  }

  .carousel-slide-images img {
    flex: 1 1 0;
    min-width: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

/* Bar overlaying the bottom of the track, always dark. Bottom-anchored and
   auto-height: single-line by default, and when the caption expands the row
   grows *upward* (height increases, bottom stays put) instead of pushing
   the counter/nav around or shifting page content below. A sibling of the
   track (not nested inside it) so it stays fixed while slides scroll past. */
.carousel-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: rgb(0 0 0 / 0.65);
  backdrop-filter: blur(10px);
  border-radius: 0 0 0.375rem 0.375rem;
}

/* Clipping lives on the caption itself, not the bar: the bar is
   `align-items: flex-end`, so a bar-level clip anchors to the bottom of the
   row and shows the *last* wrapped line instead of the first. Height is set
   inline from JS-measured real values (see measureCaption()) so this
   transitions to its exact target instead of a fixed, oversized cap. */
.carousel-caption {
  position: relative;
  flex: 1 1 auto;
  align-self: center;
  min-width: 0;
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  color: #fff;
  font-size: 0.875rem;
  line-height: 1.25rem;
  white-space: normal;
  overflow: hidden;
  transition: height 0.25s ease;
}

/* Reserves room for the chevron only while it's actually shown, so it
   doesn't overlay the last word of the collapsed line. */
.carousel-caption--has-more {
  padding-right: 1.25rem;
}

/* Fixed to the caption's own right edge regardless of wrap point — an inline
   "…" after the text landed wherever the last visible word happened to end. */
.carousel-caption-more {
  position: absolute;
  right: 0;
  top: 50%;
  translate: 0 -50%;
  color: rgb(255 255 255 / 0.75);
}

.carousel-bar-nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.carousel-counter {
  font-size: 0.8rem;
  color: rgb(255 255 255 / 0.75);
  white-space: nowrap;
}

/* Circular look + hover come from .btn / .btn-icon. A dark disc for
   legibility over bright screenshots is the carousel-specific extra —
   prev/next now sit inline in the bar, so no absolute positioning needed. */
.carousel-nav {
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

/* Vertical paging within a slide's image group (mobile only — desktop shows
   the whole group at once side by side). Grouped outside the carousel's
   right edge, overflowing into the modal's existing side padding per
   explicit design choice, rather than shrinking the carousel to fit them. */
.carousel-subnav {
  position: absolute;
  right: -2rem;
  top: 50%;
  translate: 0 -50%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (width >= theme(--breakpoint-md)) {
  .carousel-subnav {
    display: none;
  }
}
</style>
