<script setup lang="ts">
/**
 * Inline experience entry — renders without a modal link.
 */
import type { ExperienceEntry } from '@/types/experience'
import { formatExperienceDate } from '@/utils/date'
import TechBadge from '@/components/ui/TechBadge.vue'

defineProps<{
  item: ExperienceEntry
}>()
</script>

<template>
  <div class="experience-entry">
    <div class="experience-header">
      <h2 class="experience-title m-0">{{ item.title }}</h2>
      <span class="experience-company">{{ item.company }}</span>
      <span class="experience-dates">{{ formatExperienceDate(item.start) }} – {{ formatExperienceDate(item.end) }}</span>
    </div>
    <p v-if="item.summary" class="experience-summary">{{ item.summary }}</p>
    <ul v-if="item.skills?.length" class="tag-list">
      <TechBadge v-for="skill in item.skills" :key="skill.label" :tag="skill" />
    </ul>
  </div>
</template>

<style scoped>
.experience-entry {
  margin: 1.25rem 0;
  padding-left: 1rem;
  border-bottom: 1px solid var(--color-border);
  border-left: 2px solid var(--color-primary);
}

.experience-entry:last-child {
  border-bottom: none;
}

.experience-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.experience-title {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.25rem;
  color: var(--color-accent-light);
}

.experience-company {
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.experience-dates {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-primary-light);
  margin-left: auto;
}

.experience-summary {
  font-size: 0.9rem;
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

</style>
