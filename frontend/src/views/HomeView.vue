<script setup lang="ts">
/**
 * Home page — fetches the resolved page layout from the API and renders each
 * section dynamically by mapping section.type to the appropriate component.
 */
import { type Component } from 'vue'
import { usePageData } from '@/composables/usePageData'
import HeroSection from '@/components/home/HeroSection.vue'
import FeaturedPortfolioSection from '@/components/home/FeaturedPortfolioSection.vue'
import FeaturedArticlesSection from '@/components/home/FeaturedArticlesSection.vue'
import SkillsSection from '@/components/home/SkillsSection.vue'

const { data, loading, error } = usePageData('home')

const sectionComponents: Record<string, Component> = {
  'hero': HeroSection,
  'featured-portfolio': FeaturedPortfolioSection,
  'featured-articles': FeaturedArticlesSection,
  'skills': SkillsSection,
}
</script>

<template>
  <div class="view-container">
    <p v-if="loading">Loading…</p>
    <p v-else-if="error">Error: {{ error }}</p>
    <template v-else-if="data">
      <component
        v-for="section in data.sections"
        :key="section.type"
        :is="sectionComponents[section.type]"
        :section="section"
      />
    </template>
  </div>
</template>
