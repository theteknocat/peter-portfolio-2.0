<script setup lang="ts">
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
</script>

<template>
  <div class="view-container">
    <SectionHeading>Articles</SectionHeading>
    <ContentCard>
      <p>Article cards pulled from the articles manifest will appear here.</p>
    </ContentCard>
  </div>
</template>

<style scoped>
.view-container {
  max-width: 72rem;
  margin-inline: auto;
  padding: 2rem 1.5rem;
}
</style>
