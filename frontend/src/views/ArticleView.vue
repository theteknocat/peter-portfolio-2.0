<script setup lang="ts">
import { useRoute } from 'vue-router'
import ContentCard from '@/components/ui/ContentCard.vue'

const route = useRoute()
</script>

<template>
  <ContentCard>
    <h2>Article: {{ route.params.slug }}</h2>
    <p>Full article body will render here, fetched from the API by slug.</p>
  </ContentCard>
</template>
