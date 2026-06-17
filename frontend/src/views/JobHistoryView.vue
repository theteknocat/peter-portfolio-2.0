<script setup lang="ts">
/**
 * Job history page — fetches the job-history page layout and renders
 * each job entry inline (no modal).
 */
import { computed } from 'vue'
import { usePageData } from '@/composables/usePageData'
import type { Job } from '@/types/job'
import PageTitle from '@/components/ui/PageTitle.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
import JobEntryCard from '@/components/jobs/JobEntryCard.vue'

const { data, loading, error } = usePageData('job-history')

const items = computed(
  () => (data.value?.sections[0]?.items ?? []) as unknown as Job[]
)
</script>

<template>
  <div class="view-container">
    <PageTitle>Job History</PageTitle>
    <ContentCard>
      <p v-if="loading">Loading…</p>
      <p v-else-if="error">Error: {{ error }}</p>
      <div v-else class="job-list">
        <JobEntryCard v-for="item in items" :key="item.slug" :item="item" />
      </div>
    </ContentCard>
  </div>
</template>
