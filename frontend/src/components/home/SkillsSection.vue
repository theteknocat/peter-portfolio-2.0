<script setup lang="ts">
/**
 * Skills section — interactive hex grid of skill icons from the skills content file.
 * Expects section.content from 'pages/skills.yaml'.
 */
import { ref, computed } from 'vue'
import { RotateCcw } from '@lucide/vue'
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
      <h2 class="text-center">{{ content?.title ?? 'Skills' }}</h2>
      <HexSkillsGrid ref="gridRef" v-if="content?.skills?.length" :skills="content.skills" />
      <p v-else>Skills content not yet loaded.</p>
      <button
        v-if="gridRef?.isReordered"
        class="reset-order-btn"
        title="Reset order"
        aria-label="Reset skill order"
        @click="gridRef?.resetOrder()"
      >
        <RotateCcw :size="18" />
      </button>
    </ContentCard>
  </section>
</template>

<style scoped>
.reset-order-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.33rem;
  color: var(--color-accent);
  background: transparent;
  border: 0.06rem solid var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.reset-order-btn:hover,
.reset-order-btn:focus-visible {
  outline: none;
  color: var(--color-primary-light);
  border-color: var(--color-primary-light);
}

.reset-order-btn:hover svg,
.reset-order-btn:focus-visible svg {
  animation: icon-glitch 4s linear infinite;
}
</style>
