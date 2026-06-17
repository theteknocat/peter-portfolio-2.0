<script setup lang="ts">
/**
 * Full-viewport overlay wrapper for second-level (detail) routes.
 * Renders the named "modal" RouterView, locks background scroll,
 * and handles close via button, backdrop click, or Escape key.
 */
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import { closeModal } from '@/composables/useModalNavigation'

const route       = useRoute()
const router      = useRouter()
const modalWrapper = ref<HTMLElement | null>(null)

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let savedFocus: Element | null = null

function close(): void {
  closeModal(router, route.path)
  ;(savedFocus as HTMLElement | null)?.focus()
  savedFocus = null
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close()
    return
  }

  if (event.key === 'Tab' && route.meta.modal && modalWrapper.value) {
    const focusable = Array.from(modalWrapper.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (!focusable.length) return
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }
}

watch(
  () => route.meta.modal,
  (isModal) => {
    document.body.classList.toggle('modal-open', Boolean(isModal))
    if (isModal) {
      nextTick(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        savedFocus = document.activeElement
        modalWrapper.value?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
      })
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
  <Transition name="modal">
    <div v-if="route.meta.modal" class="modal-backdrop" @click.self="close">
      <div ref="modalWrapper" class="modal-wrapper" role="dialog" aria-modal="true">
        <button class="modal-close" aria-label="Close" @click="close">
          <X :size="18" />
        </button>
        <div class="modal-container">
          <RouterView name="modal" />
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
  background-color: rgba(0, 0, 0, 0.01);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0 1.5rem;
  overflow-y: auto;
  perspective: 1200px;
}

.modal-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 72rem;
  min-height: calc(100vh - 6rem);
  padding: 1.5rem 0;
}

.modal-close {
  position: absolute;
  z-index: 10;
  right: -0.9rem;
  top: 0.6rem;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  background: transparent;
  border: 0.06rem solid var(--color-accent);
  border-radius: 50%;
  padding: 0.33rem;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.modal-close:hover,
.modal-close:focus-visible {
  outline: none;
  color: var(--color-primary-light);
  border-color: var(--color-primary-light);
  & svg {
    animation: icon-glitch 4s linear infinite;
  }
}

.modal-container {
  flex: 1;
  padding: 2.5rem;
  --cove-fill: rgba(2, 2, 3, 0.88);
  --cove-border: var(--color-accent);
  @apply cove-corners cove-r-[17px];
}

/* Backdrop fades independently of the panel */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.35s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Panel sweeps in from bottom-left, rotating to flat as it settles */
.modal-enter-active .modal-wrapper {
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-enter-from .modal-wrapper {
  transform: translate(-50vw, 50vh) scale(0.30) rotateX(-30deg) rotateY(-45deg);
}

/* Panel retreats to bottom-left — reverse of the entrance */
.modal-leave-active .modal-wrapper {
  transition: transform 0.35s ease-in;
}

.modal-leave-to .modal-wrapper {
  transform: translate(-50vw, 50vh) scale(0.30) rotateX(-30deg) rotateY(-45deg);
}
</style>
