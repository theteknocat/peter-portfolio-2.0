<script setup lang="ts">
/**
 * Full-viewport overlay wrapper for second-level (detail) routes.
 * Renders the named "modal" RouterView, locks background scroll,
 * and handles close via button, backdrop click, or Escape key.
 *
 * Provides 'signalModalReady' for inner views to call once their content
 * has loaded — the backdrop appears immediately, the panel only animates
 * in after the signal fires.
 */
import { ref, watch, onMounted, onUnmounted, nextTick, provide } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { X, LoaderCircle } from '@lucide/vue'
import { closeModal } from '@/composables/useModalNavigation'

const route        = useRoute()
const router       = useRouter()
const modalWrapper = ref<HTMLElement | null>(null)
const contentReady = ref(false)

provide('signalModalReady', () => {
  contentReady.value = true
})

let savedScrollY = 0
let savedFocus: HTMLElement | null = null

function close(): void {
  closeModal(router, route.path)
  savedFocus?.focus({ preventScroll: true })
  savedFocus = null
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close()
}

watch(
  () => route.meta.modal,
  (isModal, wasModal) => {
    document.body.classList.toggle('modal-open', Boolean(isModal))
    if (isModal) {
      contentReady.value = false
      savedScrollY = window.scrollY
      savedFocus   = document.activeElement as HTMLElement | null
      nextTick(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        modalWrapper.value?.focus({ preventScroll: true })
      })
    } else if (wasModal) {
      nextTick(() => window.scrollTo({ top: savedScrollY, behavior: 'instant' }))
    }
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
  <Transition name="modal" @before-leave="(el: Element) => { el.scrollTop = 0 }">
    <div v-if="route.meta.modal" class="modal-backdrop" @click.self="close">
      <Transition name="modal-spinner">
        <div v-if="!contentReady" class="modal-loading">
          <LoaderCircle :size="20" />
        </div>
      </Transition>
      <div ref="modalWrapper" class="modal-wrapper" :class="{ 'panel-visible': contentReady }" role="dialog" aria-modal="true" tabindex="-1">
        <button v-if="contentReady" class="btn modal-close" aria-label="Close" @click="close">
          <X :size="18" />
        </button>
        <div class="modal-container">
          <RouterView name="modal" :key="(route.params.slug as string)" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@reference "../../assets/css/main.css";

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background-color: rgba(5, 15, 10, 0.05);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0 1.5rem;
  overflow-y: auto;
}

.modal-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 72rem;
  min-height: calc(100vh - 6rem);
  padding: 1.5rem 0;
  outline: none;
  /* Starts in the panel-enter-from state — off-screen and invisible */
  opacity: 0;
  pointer-events: none;
  transform-origin: 0 100vh;
  transform: perspective(1000px) translateX(-20vw) scale(0.30) rotateY(-5deg) rotateX(-2deg);
  transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
}

.modal-wrapper.panel-visible {
  opacity: 1;
  pointer-events: auto;
  transform: none;
}

/* Circular geometric variant — extends .btn with a plain border + position. */
.modal-close {
  position: absolute;
  z-index: 10;
  right: -0.9rem;
  top: 0.6rem;
  aspect-ratio: 1;
  padding: 0.33rem;
  border: 0.06rem solid var(--color-accent);
  border-radius: 50%;
}

/* Border lives unlayered here, so its hover colour must too — a layered
   .btn:hover border-color would lose to this scoped border shorthand. */
.modal-close:hover,
.modal-close:focus-visible {
  border-color: var(--color-primary-light);
}

.modal-container {
  flex: 1;
  padding: 2.5rem;
  --shape-fill: rgba(21, 21, 29, 0.92);
  --shape-border: var(--color-accent);
  @apply shape-cove cove-r-[17px];
}

/* Backdrop fades independently of the panel */
.modal-enter-active {
  transition: opacity 0.35s ease;
}

.modal-leave-active {
  transition: opacity 0.35s ease 0.15s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Panel retreats to bottom-left when the backdrop closes.
   Defined after .panel-visible so these win at equal specificity. */
.modal-leave-active .modal-wrapper {
  transition: transform 0.5s ease-in, opacity 0.35s ease 0.15;
}

.modal-leave-to .modal-wrapper {
  transform: perspective(1000px) translateX(-20vw) scale(0.30) rotateY(-5deg) rotateX(-2deg);
  opacity: 0;
}

/* Loading spinner — fixed to match the close button position */
.modal-loading {
  position: fixed;
  top: 2.1rem;
  right: calc(max(1.5rem, (100vw - 72rem) / 2) - 0.9rem);
  z-index: 101;
  color: var(--color-accent);
  animation: spin 1s linear infinite;
}

.modal-spinner-enter-active,
.modal-spinner-leave-active {
  transition: opacity 0.2s ease;
}

.modal-spinner-enter-from,
.modal-spinner-leave-to {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
