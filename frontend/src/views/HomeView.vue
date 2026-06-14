<script setup lang="ts">
import SectionHeading from '@/components/ui/SectionHeading.vue'
import ContentCard from '@/components/ui/ContentCard.vue'
</script>

<template>
  <div class="view-container">
    <SectionHeading>Peter Epp</SectionHeading>
    <ContentCard>
      <p>Hero section, featured work, featured articles, and skills will live here.</p>
      <p>
        This is a paragraph with a link to
        <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index">an MDN article about z-index and stacking contexts in CSS positioned layout</a>
        that is long enough to wrap onto the next line mid-link.
      </p>
    </ContentCard>
  </div>
</template>
