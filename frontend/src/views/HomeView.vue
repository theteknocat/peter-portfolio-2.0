<script setup lang="ts">
/**
 * Home page — fetches the resolved page layout from the API and renders each
 * section dynamically by mapping section.type to the appropriate component.
 */
import { type Component, computed } from 'vue'
import { Briefcase, Newspaper, Hexagon } from '@lucide/vue'
import { usePageData } from '@/composables/usePageData'
import PageTitle from '@/components/ui/PageTitle.vue'
import IntroTerminal from '@/components/home/IntroTerminal.vue'
import FeaturedPortfolioSection from '@/components/home/FeaturedPortfolioSection.vue'
import FeaturedArticlesSection from '@/components/home/FeaturedArticlesSection.vue'
import SkillsSection from '@/components/home/SkillsSection.vue'

const { data, loading, error } = usePageData('home')

const sectionComponents: Record<string, Component> = {
  'intro': IntroTerminal,
  'featured-portfolio': FeaturedPortfolioSection,
  'featured-articles': FeaturedArticlesSection,
  'skills': SkillsSection,
}

function resolveSection(type: string): Component | undefined {
  const component = sectionComponents[type]
  if (!component && import.meta.env.DEV) {
    console.warn(`[HomeView] No component registered for section type: "${type}"`)
  }
  return component
}

// Intro lives in the sticky left column; everything else scrolls on the right.
const introSection = computed(() => data.value?.sections.find(s => s.type === 'intro'))
const bodySections = computed(() => data.value?.sections.filter(s => s.type !== 'intro') ?? [])

const introTitle = computed(
  () => (introSection.value?.content?.title as string | undefined) ?? 'Peter Epp',
)

// Section-nav metadata: label + icon per scrollable section type. Labels match
// each section's heading; adjust here. Sections not listed get no nav button.
const navMeta: Record<string, { label: string; icon: Component }> = {
  'featured-portfolio': { label: 'Featured Work', icon: Briefcase },
  'featured-articles':  { label: 'Recent Writing', icon: Newspaper },
  'skills':             { label: 'Skills', icon: Hexagon },
}

const navItems = computed(() =>
  bodySections.value
    .filter(s => s.type in navMeta)
    .map(s => ({ type: s.type, ...navMeta[s.type] })),
)
</script>

<template>
  <div class="view-container pb-0">
    <p v-if="loading">Loading…</p>
    <p v-else-if="error">Error: {{ error }}</p>
    <template v-else-if="data">
      <div class="home-grid">
        <div class="home-left md:pb-4">
          <PageTitle class="home-title">{{ introTitle }}</PageTitle>
          <nav v-if="navItems.length" class="section-nav" aria-label="Page sections">
            <a
              v-for="item in navItems"
              :key="item.type"
              :href="`#${item.type}`"
              class="btn shape-chamfer shape-jitter"
            >
              <component :is="item.icon" :size="18" />
              <span class="text-sm">{{ item.label }}</span>
            </a>
          </nav>
          <component
            v-if="introSection"
            :is="resolveSection('intro')"
            :section="introSection"
          />
        </div>
        <div class="home-right">
          <component
            v-for="section in bodySections"
            :key="section.type"
            :id="section.type"
            :is="resolveSection(section.type)"
            :section="section"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.view-container {
  gap: 1.5rem;
}

/* Mobile: single stacked column (unchanged behaviour). */
.home-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.home-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  /* Top: stands in for the page title other pages have above their content.
     Bottom: replaces the view-container bottom padding (zeroed via pb-0) so the
     spacing lives inside .home-grid and the sticky panel doesn't shift at the
     scroll bottom. */
  padding-block: 1rem 2rem;
}

.section-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-block: 0.75rem 1.25rem;
}

/* Home title sits in the narrow left pane — drop it from h1 to h3 scale.
   Class arrives on PageTitle's root via attribute fallthrough. */
.home-title {
  font-size: calc(1.3175rem + 0.81vw);
}

/* Keep section tops clear of the sticky header when scrolled to via hash. */
.home-right > * {
  scroll-margin-top: var(--header-height);
}

/* Desktop: intro left, sections scroll right. */
@media (width >= theme(--breakpoint-md)) {
  .home-grid {
    display: grid;
    grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
    align-items: start;
  }

  .home-title {
    font-size: 1.925rem;
  }

  /* Sticky panel filling the gap between sticky header and footer. */
  .home-left {
    position: sticky;
    top: var(--header-height);
    height: calc(100svh - var(--header-height) - var(--footer-height));
    display: flex;
    flex-direction: column;
  }
}
</style>
