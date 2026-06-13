<script setup lang="ts">
/**
 * Full-viewport overlay wrapper for second-level (detail) routes.
 * Renders the named "modal" RouterView, locks background scroll,
 * and handles close via button, backdrop click, or Escape key.
 */
import { watch, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'

// useRoute() gives reactive access to the current route — equivalent to
// this.$route in Options API. Updates automatically on navigation.
const route  = useRoute()

// useRouter() gives access to the router instance — equivalent to
// this.$router. Used here to call router.back() when closing.
const router = useRouter()

function close(): void {
  router.back()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

// watch() takes a reactive source (here: an arrow function returning
// route.meta.modal) and runs the callback whenever it changes.
// We use it to add/remove a CSS class on <body> that disables scroll.
watch(
  // We use an arrow function so Vue can re-read route.meta.modal each time
  // it checks for changes, rather than capturing its value once at registration.
  () => route.meta.modal,
  (isModal) => {
    document.body.classList.toggle('modal-open', Boolean(isModal))
  },
  { immediate: true },  // run once immediately on mount as well
)

onMounted(()   => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.body.classList.remove('modal-open')
})
</script>

<template>
  <Transition name="modal">
    <div v-if="route.meta.modal" class="modal-backdrop" @click.self="close">
      <div class="modal-container" role="dialog" aria-modal="true">
        <button class="modal-close" aria-label="Close" @click="close">
          <X :size="20" />
        </button>
        <RouterView name="modal" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 56rem;
  background-color: var(--color-bg-dark);
  border: 1px solid var(--color-primary);
  padding: 2rem;
  margin-block: auto;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  background: transparent;
  border: 1px solid transparent;
  padding: 0.25rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.modal-close:hover {
  color: var(--color-primary-light);
  border-color: var(--color-primary);
}

/* Transition: fade + slide up */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
