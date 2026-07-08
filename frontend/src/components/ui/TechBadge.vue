<script setup lang="ts">
/**
 * Pill-style skill tag with an optional icon to the left of the label.
 * Renders as a <li> so it drops directly into a .tag-list <ul>.
 *
 * Icon resolution order:
 *   1. tag.si   — Simple Icons slug (e.g. 'php', 'vuedotjs') → SVG via v-html
 *   2. tag.lucide — Lucide component name (e.g. 'Plug') → <component :is>
 *   3. Neither  — label only
 */
import { computed, type Component } from 'vue'
import type { Tag } from '@/types/portfolio'
import { siIcons } from '@/utils/techIcons'
import { stripTitle } from '@/utils/svg'
import { Plug, RefreshCw, Smartphone, Database, Terminal, Server, Network, Users, GitPullRequest, Sparkles, Handshake, Headset, ShoppingCart, Megaphone } from '@lucide/vue'

const props = defineProps<{ tag: Tag; iconOnly?: boolean }>()

// Lucide components available for use in YAML (lucide: ComponentName).
// Add imports above and entries here when new generic icons are needed.
const lucideComponents: Record<string, Component> = {
  Plug,
  RefreshCw,
  Smartphone,
  Database,
  Terminal,
  Server,
  Network,
  Users,
  GitPullRequest,
  Sparkles,
  Handshake,
  Headset,
  ShoppingCart,
  Megaphone,
}

const siIcon = computed(() =>
  props.tag.si ? (siIcons[props.tag.si] ?? null) : null
)

const lucideComponent = computed(() =>
  props.tag.lucide ? (lucideComponents[props.tag.lucide] ?? null) : null
)

const hasIcon = computed(() => !!siIcon.value || !!lucideComponent.value)

// Collapse to icon-only only when there's actually an icon to show — an
// icon-less tag (e.g. "Slim 4") keeps its label so it isn't rendered blank.
const collapse = computed(() => !!props.iconOnly && hasIcon.value)
</script>

<template>
  <li
    class="tech-badge shape-para"
    :class="{ 'tech-badge--icon-only': collapse }"
    v-tooltip="collapse ? tag.label : ''"
    :tabindex="collapse ? 0 : undefined"
  >
    <span
      v-if="siIcon"
      class="tech-badge__icon tech-badge__icon--filled"
      v-html="stripTitle(siIcon.svg)"
      aria-hidden="true"
    />
    <span
      v-else-if="lucideComponent"
      class="tech-badge__icon"
      aria-hidden="true"
    >
      <component :is="lucideComponent" />
    </span>
    <span class="tech-badge__label" :class="{ 'sr-only': collapse }">{{ tag.label }}</span>
  </li>
</template>

<style scoped>
.tech-badge {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 0; /* override .tag-list li — each zone manages its own padding */
}

.tech-badge:focus-visible {
  outline: 1px solid var(--color-primary-light);
  outline-offset: 3px;
}

.tech-badge__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0.35rem 0.2rem 0.35rem 0.75rem;
}

/* Both icon sets now sit inside a .tech-badge__icon span, so the SVG is always
   a child sized here. */
.tech-badge__icon :deep(svg) {
  width: 1rem;
  height: 1rem;
}

/* Simple Icons are filled paths (default black) — tint to currentColor.
   Lucide is stroke-based and is left untouched so it stays an outline. */
.tech-badge__icon--filled :deep(svg) {
  fill: currentColor;
}

.tech-badge__label {
  /* Vertical padding matches .tech-badge__icon's total height (16px svg + 4px
     padding = 20px) so text-only tags are the same height as icon tags even
     when wrapped alone onto a row with no taller sibling to flex-stretch to. */
  padding: 0.475rem 0.875rem 0.475rem 0.25rem;
  line-height: 1;
}

/* Text-only badge — label is first child, restore full left padding */
.tech-badge__label:first-child {
  padding-inline-start: 0.875rem;
}

/* Icon-only badge — balanced padding around the lone icon (label is sr-only) */
.tech-badge--icon-only .tech-badge__icon {
  padding: 0.25rem 0.75rem;
}
</style>
