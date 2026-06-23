<script setup lang="ts">
/**
 * Full-viewport loading cover shown on every page load.
 * Waits for the router to be ready, then holds for a fixed delay (consistent
 * across all routes — gives every page a bit of weight, and covers the modal
 * enter transition on direct loads). Fades out and removes itself when done.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const LOAD_DELAY_MS = 500

const visible = ref(true)

onMounted(async () => {
  await router.isReady()
  await new Promise<void>(resolve => setTimeout(resolve, LOAD_DELAY_MS))

  visible.value = false
})
</script>

<template>
  <Transition name="loading-screen">
    <div v-if="visible" class="loading-screen" aria-live="polite" aria-label="Loading">
      <span class="loading-text">Loading...</span>
    </div>
  </Transition>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-dark);
}

.loading-text {
  font-family: system-ui, sans-serif;
  font-size: 1.25rem;
  color: var(--color-accent);
  letter-spacing: 0.1em;
}

.loading-screen-leave-active {
  transition: opacity 0.3s ease;
}

.loading-screen-leave-to {
  opacity: 0;
}
</style>
