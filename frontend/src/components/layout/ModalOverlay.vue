<script setup lang="ts">
/**
 * Full-viewport overlay wrapper for second-level (detail) routes.
 * Renders the named "modal" RouterView, locks background scroll,
 * and handles close via button, backdrop click, or Escape key.
 */
import { watch, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'

const route  = useRoute()
const router = useRouter()

function close(): void {
  router.back()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

watch(
  () => route.meta.modal,
  (isModal) => {
    document.body.classList.toggle('modal-open', Boolean(isModal))
  },
  { immediate: true },
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
      <div class="modal-wrapper">
        <div class="modal-close-row">
          <button class="modal-close" aria-label="Close" @click="close">
            <X :size="18" />
          </button>
        </div>
        <div class="modal-container">
          <RouterView name="modal" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1.5rem;
  overflow-y: auto;
}

.modal-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 72rem;
  min-height: calc(100vh - 6rem);
}

.modal-close-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

.modal-close {
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
  color: var(--color-accent-light);
  border-color: var(--color-accent);
}

.modal-container {
  flex: 1;
  background-color: rgba(2, 2, 3, 0.88);
  border: 1px solid var(--color-accent);
  padding: 2.5rem;
}

/* Transition: fade + slight rise */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}
</style>
