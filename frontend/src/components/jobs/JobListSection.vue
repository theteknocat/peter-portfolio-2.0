<script setup lang="ts">
/**
 * Job list section — renders the manifest-driven list of job entries for a
 * resolved 'job-list' section.
 */
import { computed } from 'vue'
import type { ResolvedSection } from '@/types/page'
import type { Job } from '@/types/job'
import JobEntryCard from '@/components/jobs/JobEntryCard.vue'

const props = defineProps<{ section: ResolvedSection }>()

const items = computed(() => (props.section.items ?? []) as unknown as Job[])
const title = computed(() => props.section.content?.title as string | undefined)
</script>

<template>
  <div>
    <h2 v-if="title">{{ title }}</h2>
    <div class="job-list">
      <JobEntryCard v-for="item in items" :key="item.slug" :item="item" />
    </div>
  </div>
</template>
