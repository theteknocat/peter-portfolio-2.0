<script setup lang="ts">
/**
 * Skills section — interactive hex grid of skill icons from the skills content file.
 * Expects section.content from 'pages/skills.yaml'.
 */
import { ref, computed } from 'vue'
import { RotateCcw, Shuffle } from '@lucide/vue'
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
</script>

<template>
  <section class="home-skills">
    <ContentCard>
      <h2 class="text-center relative">
        {{ content?.title ?? 'Skills' }}
        <div v-if="content?.skills?.length" class="skills-actions flex gap-2 items-center justify-center mt-2 md:mt-0 md:absolute md:top-1/2 md:right-0 md:-translate-y-1/2">
          <button
            class="skill-action-btn"
            title="Shuffle skills"
            aria-label="Shuffle skill order"
            @click="gridRef?.shuffleOrder()"
          >
            <Shuffle :size="18" />
            <span class="text-sm pr-1">Shuffle</span>
          </button>
          <button
            :disabled="!gridRef?.isReordered"
            class="skill-action-btn"
            title="Reset order"
            aria-label="Reset skill order"
            @click="gridRef?.resetOrder()"
          >
            <RotateCcw :size="18" />
            <span class="text-sm pr-1">Reset</span>
          </button>
        </div>
      </h2>
      <template v-if="content?.skills?.length">
        <p class="text-center text-sm">Try shuffling/re-ordering the skills then see if you can restore their original order.</p>
        <HexSkillsGrid ref="gridRef" v-if="content?.skills?.length" :skills="content.skills" />
      </template>
      <p v-else>Skills content not yet loaded.</p>
    </ContentCard>
  </section>
</template>

<style scoped>
.home-skills {
  overflow: hidden;
}

.skill-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.33rem;
  color: var(--color-accent);
  background: transparent;
  border: 0.06rem solid var(--color-accent);
  border-radius: 50em;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.skill-action-btn:hover,
.skill-action-btn:focus-visible {
  outline: none;
  color: var(--color-primary-light);
  border-color: var(--color-primary-light);
}

.skill-action-btn:hover svg,
.skill-action-btn:focus-visible svg {
  animation: icon-glitch 4s linear infinite;
}
</style>
