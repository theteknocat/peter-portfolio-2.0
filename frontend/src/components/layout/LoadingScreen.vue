<script setup lang="ts">
/**
 * Full-viewport loading cover shown on every page load.
 * Waits for the router to be ready and Vue to render, then waits an additional
 * delay if a modal is open (so the modal enter transition completes before the
 * cover lifts). Fades out and removes itself from the DOM when done.
 */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route  = useRoute()

const MODAL_TRANSITION_MS = 500

const visible = ref(true)

onMounted(async () => {
  await router.isReady()
  await new Promise<void>(resolve => setTimeout(resolve, 0))

  if (route.meta.modal) {
    await new Promise<void>(resolve => setTimeout(resolve, MODAL_TRANSITION_MS))
  }

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
