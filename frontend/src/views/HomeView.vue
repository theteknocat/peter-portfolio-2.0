<script setup lang="ts">
/**
 * Home page — fetches the resolved page layout from the API and renders each
 * section dynamically by mapping section.template to the appropriate component.
 */
import { type Component, computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { Briefcase, Newspaper, Joystick, Trophy } from '@lucide/vue'
import { usePageData } from '@/composables/usePageData'
import { useSeo } from '@/composables/useSeo'
import PageTitle from '@/components/ui/PageTitle.vue'
import IntroTerminal from '@/components/home/IntroTerminal.vue'
import FeaturedPortfolioSection from '@/components/home/FeaturedPortfolioSection.vue'
import FeaturedArticlesSection from '@/components/home/FeaturedArticlesSection.vue'
import SkillsSection from '@/components/home/SkillsSection.vue'
import ExperienceStatsSection from '@/components/home/ExperienceStatsSection.vue'

const { data, error } = await usePageData('home')

useSeo({
  title: 'Peter Epp — Full-Stack Web Developer',
  description:
    'Portfolio of Peter Epp, a full-stack web developer specialising in Drupal, PHP, and modern JavaScript.',
  path: '',
})

const sectionComponents: Record<string, Component> = {
  'intro': IntroTerminal,
  'experience-stats': ExperienceStatsSection,
  'featured-portfolio': FeaturedPortfolioSection,
  'featured-articles': FeaturedArticlesSection,
  'skills': SkillsSection,
}

function resolveSection(template: string): Component | undefined {
  const component = sectionComponents[template]
  if (!component && import.meta.env.DEV) {
    console.warn(`[HomeView] No component registered for section template: "${template}"`)
  }
  return component
}

// Intro lives in the sticky left column; everything else scrolls on the right.
const introSection = computed(() => data.value?.sections.find(s => s.template === 'intro'))
const bodySections = computed(() => data.value?.sections.filter(s => s.template !== 'intro') ?? [])

const introTitle = computed(
  () => (introSection.value?.content?.title as string | undefined) ?? 'Peter Epp',
)

// Icons per section template — labels come from section.content.title.
// Sections without a registered icon or without a content title get no nav button.
const navIcons: Record<string, Component> = {
  'experience-stats':   Trophy,
  'featured-portfolio': Briefcase,
  'featured-articles':  Newspaper,
  'skills':             Joystick,
}

const navItems = computed(() =>
  bodySections.value
    .filter(s => s.template in navIcons && s.content?.title)
    .map(s => ({ template: s.template, icon: navIcons[s.template], label: s.content!.title as string })),
)

// Active section tracking: highlight the nav button for whichever right-column
// section is most in view, whether reached by clicking a nav link or scrolling.
const activeSection = ref('')
let observer: IntersectionObserver | null = null
const ratios = new Map<string, number>()

function setupObserver() {
  if (typeof IntersectionObserver === 'undefined') return // no IntersectionObserver during SSG prerender
  observer?.disconnect()
  ratios.clear()
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0)
      }
      let best = ''
      let bestRatio = 0
      for (const [id, r] of ratios) {
        if (r > bestRatio) {
          bestRatio = r
          best = id
        }
      }
      if (best) activeSection.value = best
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  )
  for (const item of navItems.value) {
    const el = document.getElementById(item.template)
    if (el) observer.observe(el)
  }
}

// Sections render async (after page data loads), so wire the observer once the
// nav items exist and the DOM has flushed.
watch(
  navItems,
  async () => {
    await nextTick()
    if (navItems.value.length) setupObserver()
  },
  { immediate: true },
)

onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="view-container pb-0">
    <p v-if="error">Error: {{ error }}</p>
    <template v-else-if="data">
      <div class="home-grid">
        <div class="home-left md:pb-4">
          <PageTitle class="home-title">{{ introTitle }}</PageTitle>
          <div class="home-intro-group">
            <component
              v-if="introSection"
              :is="resolveSection('intro')"
              :section="introSection"
            />
            <nav v-if="navItems.length" class="section-nav" aria-label="Page sections">
              <a
                v-for="item in navItems"
                :key="item.template"
                :href="`#${item.template}`"
                class="btn shape-chamfer shape-jitter"
                :class="{ active: activeSection === item.template }"
                :aria-current="activeSection === item.template ? 'true' : undefined"
              >
                <component :is="item.icon" :size="18" />
                <span class="text-sm">{{ item.label }}</span>
              </a>
            </nav>
          </div>
        </div>
        <div class="home-right">
          <component
            v-for="section in bodySections"
            :key="section.template"
            :id="section.template"
            class="home-content-section"
            :is="resolveSection(section.template)"
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
  /* Home gets more room than the standard 72rem; capped so it stays sane on
     wide displays (90rem ≈ 1440px, safe for high-DPI/scaled laptops). */
  max-width: 90rem;
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
  padding-bottom: 1rem;
}

.home-right section:first-child {
  padding-top: 1rem;
}

.section-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-block: 0.75rem 0;
}

/* Active nav button: green like hover, minus the icon-glitch animation. */
.section-nav .btn.active {
  color: var(--color-primary-light);
  --shape-border: var(--color-primary-light);
}

/* Home title sits in the narrow left pane — drop it from h1 to h3 scale.
   Class arrives on PageTitle's root via attribute fallthrough. */
.home-title {
  font-size: calc(1.3175rem + 0.81vw);
}

/* Keep section tops clear of the sticky header when scrolled to via hash.
   Perspective matches .view-container so content-card flip animations have
   a 3D context — the section <elements> are the direct parents of .content-card. */
.home-right > .home-content-section {
  scroll-margin-top: var(--header-height);
  perspective: 1200px;
}

/* Desktop: intro left, sections scroll right. */
@media (width >= theme(--breakpoint-md)) {
  .home-grid {
    display: grid;
    grid-template-columns: minmax(0, clamp(18rem, 37.5vw, 22rem)) minmax(0, 1fr);
    align-items: start;
  }

  .home-title {
    font-size: 1.925rem;
  }

  /* Sticky panel filling the gap between sticky header and footer. Overflow
     inside the terminal (not this panel) handles intro text taller than the
     slot — see IntroTerminal's .intro-scroll.
     perspective: shared 3D context for the intro group's left-edge flip. */
  .home-left {
    position: sticky;
    top: var(--header-height);
    height: calc(100svh - var(--header-height) - var(--footer-height));
    display: flex;
    flex-direction: column;
    perspective: 1200px;
  }

  /* Intro group carries the flex sizing the terminal relies on to fill height. */
  .home-intro-group {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
