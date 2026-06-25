<script setup lang="ts">
/**
 * 404 page — shown for any route the router doesn't match.
 */
import { RouterLink } from 'vue-router'
import { useSeo } from '@/composables/useSeo'
import PageTitle from '@/components/ui/PageTitle.vue'
import ContentCard from '@/components/ui/ContentCard.vue'

useSeo({
  title: 'Page Not Found — Peter Epp',
  description: 'The page you were looking for could not be found.',
  path: '/404',
})
</script>

<template>
  <div class="view-container">
    <PageTitle>404</PageTitle>
    <ContentCard>
      <p class="not-found-text">
        That page wandered off. The link may be broken, or the page may have moved.
      </p>
      <RouterLink to="/" class="btn shape-chamfer shape-jitter not-found-home">
        Back to home
      </RouterLink>
    </ContentCard>
  </div>
</template>

<style scoped>
.not-found-text {
  margin: 0 0 1.25rem;
}

.not-found-home {
  display: inline-flex;
}
</style>
