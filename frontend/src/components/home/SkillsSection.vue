<script setup lang="ts">
/**
 * Skills section — interactive hex grid of skill icons from the skills content file.
 * Expects section.content from 'pages/skills.yaml'.
 */
import { ref, computed, type Component } from 'vue'
import { RotateCcw, Shuffle, Joystick, Star, Layers, Infinity } from '@lucide/vue'
import type { ResolvedSection } from '@/types/page'
import type { Tag } from '@/types/portfolio'
import ContentCard from '@/components/ui/ContentCard.vue'
import HexSkillsGrid from '@/components/home/HexSkillsGrid.vue'

const props = defineProps<{ section: ResolvedSection }>()

const content = computed(() => props.section.content as {
  title?: string
  skills?: Tag[]
} | null | undefined)

const gridRef = ref<InstanceType<typeof HexSkillsGrid> | null>(null)

type Tier = 'core' | 'extended' | 'all'
const selectedTier = ref<Tier>('core')

const tiers: { value: Tier; label: string; icon: Component }[] = [
  { value: 'core', label: 'Core', icon: Star },
  { value: 'extended', label: 'Extended', icon: Layers },
  { value: 'all', label: 'All', icon: Infinity },
]

const filteredSkills = computed(() => {
  const skills = content.value?.skills ?? []
  if (selectedTier.value === 'all') return skills
  if (selectedTier.value === 'extended') return skills.filter(s => s.tier === 'core' || s.tier === 'extended')
  return skills.filter(s => s.tier === 'core')
})
</script>

<template>
  <section class="home-skills">
    <ContentCard>
      <h2 class="flex flex-wrap items-center justify-start gap-x-2 gap-y-0">
        <Joystick :size="24" />
        {{ content?.title ?? 'Skills' }}
        <div v-if="content?.skills?.length" class="skills-controls w-full flex flex-wrap gap-2 items-center justify-center lg:w-auto lg:ml-auto">
          <button
            v-for="tier in tiers"
            :key="tier.value"
            class="btn shape-chamfer shape-jitter"
            :class="{ 'btn--active': selectedTier === tier.value }"
            @click="selectedTier = tier.value"
          >
            <component :is="tier.icon" :size="14" />
            <span class="text-sm">{{ tier.label }}</span>
          </button>
          <span class="skills-divider" aria-hidden="true"></span>
          <button
            class="btn shape-chamfer shape-jitter"
            title="Shuffle skills"
            aria-label="Shuffle skill order"
            @click="gridRef?.shuffleOrder()"
          >
            <Shuffle :size="18" />
            <span class="text-sm">Shuffle</span>
          </button>
          <button
            :disabled="!gridRef?.isReordered"
            class="btn shape-chamfer shape-jitter"
            title="Reset order"
            aria-label="Reset skill order"
            @click="gridRef?.resetOrder()"
          >
            <RotateCcw :size="18" />
            <span class="text-sm">Reset</span>
          </button>
        </div>
      </h2>
      <template v-if="content?.skills?.length">
        <p class="text-center text-sm mb-8">Try shuffling/re-ordering my skills then see if you can restore their original order.</p>
        <HexSkillsGrid ref="gridRef" :skills="filteredSkills" />
      </template>
      <p v-else>Skills content not yet loaded.</p>
    </ContentCard>
  </section>
</template>

<style scoped>
.home-skills {
  overflow: hidden;
}

.btn--active {
  color: var(--color-primary-light);
  --shape-border: var(--color-primary-light);
}

.skills-controls .btn:hover span,
.skills-controls .btn:focus-visible span {
  animation: nav-text-glitch 4s linear infinite;
}

.skills-divider {
  display: inline-block;
  width: 1px;
  height: 1.25rem;
  background: var(--color-accent);
  opacity: 0.3;
  align-self: center;
}
</style>
