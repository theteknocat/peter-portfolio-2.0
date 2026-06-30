<script setup lang="ts">
/**
 * Inline job history entry — renders without a modal link.
 */
import type { Job } from '@/types/job'
import { formatJobDate } from '@/utils/date'
import TechBadge from '@/components/ui/TechBadge.vue'

defineProps<{
  item: Job
}>()
</script>

<template>
  <div class="job-entry">
    <div class="job-header">
      <h2 class="job-title m-0">{{ item.title }}</h2>
      <span class="job-company">{{ item.company }}</span>
      <span class="job-dates">{{ formatJobDate(item.start) }} – {{ formatJobDate(item.end) }}</span>
    </div>
    <p v-if="item.summary" class="job-summary">{{ item.summary }}</p>
    <ul v-if="item.skills?.length" class="tag-list">
      <TechBadge v-for="skill in item.skills" :key="skill.label" :tag="skill" />
    </ul>
  </div>
</template>

<style scoped>
.job-entry {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--color-border);
}

.job-entry:last-child {
  border-bottom: none;
}

.job-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.job-title {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.25rem;
  color: var(--color-accent-light);
}

.job-company {
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.job-dates {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-primary-light);
  margin-left: auto;
}

.job-summary {
  font-size: 0.9rem;
  color: var(--color-text);
  margin: 0 0 0.75rem;
}

</style>
