<script setup lang="ts">
/**
 * Experience stats — numeric badges (open-source contributions) plus a short
 * milestone timeline. Both arrays are independently optional; the section
 * renders nothing if neither is present. Expects section.content from
 * 'sections/home/experience-stats.yaml'.
 */
import { computed } from 'vue'
import { Trophy, ChevronRight } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import type { ResolvedSection } from '@/types/page'
import ContentCard from '@/components/ui/ContentCard.vue'

interface Stat {
  value: string
  label: string
}

interface TimelineEntry {
  period: string
  label: string
}

const props = defineProps<{ section: ResolvedSection }>()

const content = computed(() => props.section.content as {
  title?: string
  stats?: Stat[]
  timeline?: TimelineEntry[]
} | null | undefined)

const stats = computed(() => content.value?.stats ?? [])
const timeline = computed(() => content.value?.timeline ?? [])
</script>

<template>
  <section v-if="stats.length || timeline.length" class="home-experience-stats hex-size-responsive">
    <ContentCard>
      <h2 v-if="content?.title" class="flex flex-wrap items-center justify-start gap-x-2 gap-y-0 mb-4">
        <Trophy :size="24" />
        {{ content.title }}
        <div class="flex w-full sm:w-auto md:w-full lg:w-auto items-center sm:ml-auto md:ml-0 lg:ml-auto">
          <RouterLink to="/experience" class="btn shape-chamfer shape-jitter">
            <span class="text-sm">See all</span>
            <ChevronRight :size="16" />
          </RouterLink>
        </div>
      </h2>
      <div v-if="timeline.length" class="flex flex-col items-center">
        <ol v-if="timeline.length" class="grid grid-cols-1 md:grid-cols-2 md:w-full lg:grid-cols-4">
          <li
            v-for="entry in timeline"
            :key="entry.period"
            class="timeline-item relative flex md:flex-col items-stretch md:justify-start gap-4 md:gap-0"
          >
            <div class="timeline-item-inner relative flex items-center justify-center py-4 md:px-4 md:py-0">
              <div class="timeline-item-hex hex-sized relative z-10 aspect-[0.866]">
                <div class="hex-border" />
                <div class="hex-face">
                  <span class="text-xs font-bold text-center leading-tight px-2">{{ entry.period }}</span>
                </div>
              </div>
            </div>
            <div class="timeline-item-label self-center text-sm md:text-xs text-left md:text-center max-w-48 md:px-4 md:pt-2">{{ entry.label }}</div>
          </li>
        </ol>
      </div>

      <template v-if="stats.length">
        <h3 class="text-center mb-4">Open Source Stats</h3>
        <div v-if="stats.length" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
          <div v-for="stat in stats" :key="stat.label" class="flex flex-col items-center gap-2 text-center">
            <div class="hex-sized relative aspect-[0.866]">
              <div class="hex-border" />
              <div class="hex-face">
                <span class="text-xl sm:text-2xl font-bold">{{ stat.value }}</span>
              </div>
            </div>
            <span class=" text-sm md:text-xs max-w-36">{{ stat.label }}</span>
          </div>
        </div>
      </template>
    </ContentCard>
  </section>
</template>

<style scoped>
@reference "tailwindcss";

ol {
  --row-gap: 1.5rem;
  @media (width >= theme(--breakpoint-md)) {
    row-gap: var(--row-gap);
  }
}
.timeline-item {
  margin: 0;
}
/* Connecting line through each badge's own width — self-contained per item so it
   stays correct when the row wraps (no line spans across a wrap boundary). */
.timeline-item:not(:first-child) .timeline-item-inner::before,
.timeline-item:not(:last-child) .timeline-item-inner::after {
  content: '';
  position: absolute;
  left: 50%;
  translate: -50% 0;
  height: calc(50% - (var(--hex-h) / 2));
  width: 2px;
  background: var(--color-primary);
  z-index: 0;
  @media (width >= theme(--breakpoint-md)) {
    left: auto;
    top: 50%;
    translate: 0 -50%;
    width: calc(50% - (var(--hex-w) / 2));
    height: 2px;
  }
}

.timeline-item:not(:first-child) .timeline-item-inner::before {
  top: 0;
  @media (width >= theme(--breakpoint-md)) {
    top: 50%;
    left: 0;
    right: auto;
  }
}

.timeline-item:not(:last-child) .timeline-item-inner::after {
  bottom: 0;
  @media (width >= theme(--breakpoint-md)) {
    bottom: auto;
    left: auto;
    right: 0;
  }
}

/* Row-wrap connector: grid-cols is fixed per breakpoint, so nth-child alone knows
   which items sit at a row boundary. The default .timeline-item-inner::before/::after
   stubs stay untouched (still draw the short hex-to-edge segment at hex-mid-height).
   These new rules add on top, anchored to .timeline-item (the li) since that's a
   separate pseudo-element pair and its height accounts for the label below the hex:
   last-in-row picks up where its kept ::after stub ends and drops to the li's bottom,
   then spans the whole row back to column 1. First-in-row-next drops from that same
   point through the gap down to where its own kept ::before stub begins. */
@media (width >= theme(--breakpoint-md)) and (width < theme(--breakpoint-lg)) {
  .timeline-item {
    --cols: 2;
  }

  .timeline-item:nth-child(2n):not(:last-child)::after {
    content: '';
    position: absolute;
    top: calc(var(--hex-h) / 2);
    right: 0;
    width: calc(var(--cols) * 100%);
    height: calc(100% - (var(--hex-h) / 2) + (var(--row-gap) / 2));
    border-right: 2px solid var(--color-primary);
    border-bottom: 2px solid var(--color-primary);
    z-index: 0;
  }

  .timeline-item:nth-child(2n + 1):not(:first-child)::before {
    content: '';
    position: absolute;
    left: 0;
    top: calc(-1 * var(--row-gap) / 2);
    width: 2px;
    height: calc((var(--row-gap) / 2) + (var(--hex-h) / 2));
    background: var(--color-primary);
    z-index: 0;
  }
}

@media (width >= theme(--breakpoint-lg)) {
  .timeline-item {
    --cols: 4;
  }

  .timeline-item:nth-child(4n):not(:last-child)::after {
    content: '';
    position: absolute;
    top: calc(var(--hex-h) / 2);
    right: 0;
    width: calc(var(--cols) * 100%);
    height: calc(100% - (var(--hex-h) / 2) + (var(--row-gap) / 2));
    border-right: 2px solid var(--color-primary);
    border-bottom: 2px solid var(--color-primary);
    z-index: 0;
  }

  .timeline-item:nth-child(4n + 1):not(:first-child)::before {
    content: '';
    position: absolute;
    left: 0;
    top: calc(-1 * var(--row-gap) / 2);
    width: 2px;
    height: calc((var(--row-gap) / 2) + (var(--hex-h) / 2));
    background: var(--color-primary);
    z-index: 0;
  }
}
</style>
