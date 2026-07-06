<script setup lang="ts">
/**
 * Experience timeline section — renders the manifest-driven list of
 * experience entries as a vertical timeline with hex time-points, for a
 * resolved 'experience-timeline' section.
 */
import { computed } from 'vue'
import type { ResolvedSection } from '@/types/page'
import type { ExperienceEntry } from '@/types/experience'
import ExperienceEntryCard from '@/components/experience/ExperienceEntryCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = computed(() => (props.section.items ?? []) as unknown as ExperienceEntry[])
const title = computed(() => props.section.content?.title as string | undefined)
</script>

<template>
  <div>
    <h2 v-if="title">{{ title }}</h2>
    <ol class="grid grid-cols-1 hex-size-responsive">
      <li v-for="item in items" :key="item.slug" class="timeline-item relative flex items-stretch gap-4">
        <div class="timeline-item-inner relative flex items-center justify-center py-4">
          <div class="timeline-item-hex hex-sized relative z-10 aspect-[0.866]">
            <div class="hex-border" />
            <div class="hex-face">
              <span class="text-xs font-bold text-center leading-tight px-2">{{ item.period }}</span>
            </div>
          </div>
        </div>
        <ExperienceEntryCard class="flex-1 min-w-0" :item="item" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.timeline-item {
  margin: 0;
}
.timeline-item-hex {
  flex-shrink: 0;
}
/* Connecting line through the hex's own width, self-contained per item. */
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
}

.timeline-item:not(:first-child) .timeline-item-inner::before {
  top: 0;
}

.timeline-item:not(:last-child) .timeline-item-inner::after {
  bottom: 0;
}
</style>
