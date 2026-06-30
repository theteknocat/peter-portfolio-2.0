<script setup lang="ts">
/**
 * Portfolio item detail — rendered in the modal outlet.
 * Fetches the full item (including markdown body) by slug from the API.
 */
import { watch, inject, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useContent } from '@/composables/useContent'
import type { PortfolioItem } from '@/types/portfolio'
import MarkdownRenderer from '@/components/ui/MarkdownRenderer.vue'
import TechBadge from '@/components/ui/TechBadge.vue'
import PortfolioCarousel from '@/components/portfolio/PortfolioCarousel.vue'
import { ExternalLink, Building2 } from '@lucide/vue'

const route = useRoute()
const slug = route.params.slug as string

const { data, loading, error } = useContent<PortfolioItem>('portfolio', slug)

const signalModalReady = inject<() => void>('signalModalReady', () => {})
watch(loading, (isLoading) => { if (!isLoading) signalModalReady() })

const linkLabel = computed(() => {
  const url = data.value?.url
  if (!url) return ''
  try {
    const host = new URL(url).hostname
    if (host.includes('github.com')) return 'View on GitHub'
    if (host.includes('drupal.org')) return 'View on Drupal.org'
    return 'View Site'
  } catch {
    return 'View Link'
  }
})
</script>

<template>
  <div class="modal-content">
    <p v-if="loading">Loading…</p>
    <p v-else-if="error">Error: {{ error }}</p>
    <template v-else-if="data">
      <div class="flex flex-wrap items-center justify-between gap-x-4 mb-6">
        <h2 class="modal-title m-0">{{ data.title }}</h2>
        <ul v-if="data.tags?.length" class="tag-list modal-tags m-0">
          <TechBadge v-for="tag in data.tags" :key="tag.label" :tag="tag" :icon-only="true" />
        </ul>
        <p v-if="data.employer" class="employer-line m-0">
          <Building2 :size="16" aria-hidden="true" />
          <span>Built at</span>
          <a
            v-if="data.employer.url"
            :href="data.employer.url"
            class="employer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ data.employer.name }}
            <ExternalLink :size="12" aria-hidden="true" />
          </a>
          <span v-else class="employer-name">{{ data.employer.name }}</span>
        </p>
      </div>
      <div v-if="data.summary || data.url" class="summary-row">
        <p v-if="data.summary" class="modal-summary m-0">{{ data.summary }}</p>
        <a
          v-if="data.url"
          :href="data.url"
          class="btn shape-chamfer shape-jitter item-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink :size="14" aria-hidden="true" />
          {{ linkLabel }}
        </a>
      </div>
      <PortfolioCarousel v-if="data.images?.length" :images="data.images" :slug="slug" />
      <MarkdownRenderer v-if="data.body" :content="data.body" />
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.modal-content {
  color: var(--color-text);
}

.modal-title {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: calc(1.37rem + 1.47vw);
  color: var(--color-accent-light);
}

@media (width >= theme(--breakpoint-xl)) {
  .modal-title { font-size: 2.5rem; }
}

/* Employer attribution — context line above the summary, set apart from the
   tech badges so it reads as provenance, not another tag. */
.employer-line {
  width: 100%;        /* claim a full row so flex-wrap drops it under title/tags */
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.employer-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-accent);
  font-weight: 500;
}

.employer-link:hover,
.employer-link:focus-visible {
  color: var(--color-primary-light);
}

.employer-name {
  font-weight: 500;
  color: var(--color-accent-light);
}

.summary-row {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.modal-summary {
  flex: 1;
  font-size: 1rem;
  color: var(--color-text-light);
  font-style: italic;
}

.item-link {
  flex-shrink: 0;
  font-size: 0.875rem;
  white-space: nowrap;
}
</style>
