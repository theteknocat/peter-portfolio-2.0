<script setup lang="ts">
/**
 * Inline job history entry — renders without a modal link.
 */
import type { Job } from '@/types/job'

defineProps<{
  item: Job
}>()
</script>

<template>
  <div class="job-entry">
    <div class="job-header">
      <h2 class="job-title">{{ item.title }}</h2>
      <span class="job-company">{{ item.company }}</span>
      <span class="job-dates">{{ item.start }} – {{ item.end }}</span>
    </div>
    <p v-if="item.summary" class="job-summary">{{ item.summary }}</p>
    <ul v-if="item.skills?.length" class="job-skills">
      <li v-for="skill in item.skills" :key="skill">{{ skill }}</li>
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
  margin: 0;
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

.job-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.job-skills li {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-primary-light);
  border: 1px solid var(--color-primary-dark);
  padding: 0.125rem 0.5rem;
}
</style>
