<script setup lang="ts">
import { useRoute } from 'vue-router'
import ContentCard from '@/components/ui/ContentCard.vue'

const route = useRoute()
</script>

<template>
  <ContentCard>
    <h2>Portfolio item: {{ route.params.slug }}</h2>
    <p>Full project detail will render here, fetched from the API by slug.</p>
  </ContentCard>
</template>
