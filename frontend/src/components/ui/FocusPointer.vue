<script setup lang="ts">
/**
 * Decorative pointer shown next to whatever element has keyboard focus,
 * regardless of that element's own :focus-visible styling.
 */
import { onMounted, onUnmounted, ref } from 'vue'
import pointingFinger from '@/assets/images/pointing-finger.svg'

const top = ref(0)
const left = ref(0)
const visible = ref(false)

/**
 * True if the element is actually the topmost paint at its own on-screen
 * point — false when a sticky/fixed layer (header, footer) is covering it
 * after a scroll, so the pointer doesn't render on top of unrelated chrome.
 */
function isOccluded(el: HTMLElement, rect: DOMRect): boolean {
  const topmost = document.elementFromPoint(rect.left + 1, rect.top + rect.height / 2)
  return !!topmost && topmost !== el && !el.contains(topmost)
}

function updatePosition(el: HTMLElement): void {
  const rect = el.getBoundingClientRect()
  if (isOccluded(el, rect)) {
    visible.value = false
    return
  }
  top.value = rect.top + rect.height / 2
  left.value = rect.left
  visible.value = true
}

function onFocusIn(event: FocusEvent): void {
  const el = event.target as HTMLElement | null
  if (!el || !el.matches(':focus-visible')) {
    visible.value = false
    return
  }
  updatePosition(el)
}

function onFocusOut(): void {
  visible.value = false
}

function onScroll(): void {
  const el = document.activeElement
  if (el instanceof HTMLElement && el.matches(':focus-visible')) updatePosition(el)
}

onMounted(() => {
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
  window.addEventListener('scroll', onScroll, { passive: true, capture: true })
})

onUnmounted(() => {
  document.removeEventListener('focusin', onFocusIn)
  document.removeEventListener('focusout', onFocusOut)
  window.removeEventListener('scroll', onScroll, { capture: true })
})
</script>

<template>
  <img
    v-show="visible"
    aria-hidden="true"
    :src="pointingFinger"
    class="focus-pointer"
    :style="{ top: `${top}px`, left: `${left}px` }"
    width="28"
    height="24"
    alt=""
  />
</template>

<style scoped>
.focus-pointer {
  position: fixed;
  transform: translate(-100%, -50%);
  pointer-events: none;
  z-index: 9999;
  filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.5));
}
</style>
