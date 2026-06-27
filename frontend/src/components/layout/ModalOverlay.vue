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

const route          = useRoute()
const router         = useRouter()
const modalWrapper   = ref<HTMLElement | null>(null)
const backdropEl     = ref<HTMLElement | null>(null)
const contentReady   = ref(false)
const panelVisible   = ref(false)

provide('signalModalReady', () => {
  contentReady.value = true
})

let savedFocus: HTMLElement | null = null

function close(): void {
  closeModal(router, route.path)
  savedFocus?.focus({ preventScroll: true })
  savedFocus = null
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') { close(); return }
  if (event.key !== 'Tab') return

  const wrapper = modalWrapper.value
  if (!wrapper) return
  // Re-queried each Tab so dynamically-added focusables (close button, loaded
  // article links) are always covered. Selector excludes tabindex="-1".
  // ponytail: doesn't filter display:none / visibility:hidden focusables — none
  // exist in the modal's content today; add an offsetParent check if any appear.
  const focusables = wrapper.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  if (focusables.length === 0) { event.preventDefault(); return }

  const first  = focusables[0]
  const last   = focusables[focusables.length - 1]
  const active = document.activeElement

  // Wrapper itself holds focus on open (tabindex=-1); treat it as "before first".
  if (event.shiftKey && (active === first || active === wrapper)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => route.meta.modal,
  (isModal, wasModal) => {
    if (typeof document === 'undefined') return // no DOM during SSG prerender
    document.body.classList.toggle('modal-open', Boolean(isModal))
    if (isModal) {
      contentReady.value = false
      panelVisible.value = false
      savedFocus = document.activeElement as HTMLElement | null
      nextTick(() => modalWrapper.value?.focus({ preventScroll: true }))
    }
  },
  { immediate: true },
)

onMounted(()   => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.body.classList.remove('modal-open')
})

watch(contentReady, async (ready) => {
  if (!ready) return
  await nextTick()
  if (backdropEl.value) backdropEl.value.scrollTop = 0
  panelVisible.value = true
})

function onModalBeforeLeave(el: Element): void {
  el.scrollTop = 0
}
</script>

<template>
  <Transition name="modal" @before-leave="onModalBeforeLeave">
    <div v-if="route.meta.modal" ref="backdropEl" class="modal-backdrop" @click.self="close">
      <Transition name="modal-spinner">
        <div v-if="!contentReady" class="modal-loading">
          <LoaderCircle :size="20" />
        </div>
      </Transition>
      <div ref="modalWrapper" class="modal-wrapper" :class="{ 'panel-visible': panelVisible }" role="dialog" aria-modal="true" tabindex="-1">
        <div class="modal-container">
          <button v-if="contentReady" class="btn btn-icon border-jitter modal-close" aria-label="Close" @click="close">
            <X :size="18" />
          </button>
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
  opacity: 0;
  transform: scale(0.5);
  transform-origin: center 50vh;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  perspective: 1500px;
}

.modal-wrapper.panel-visible {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.modal-leave-active .modal-wrapper {
  transition: opacity 0.2s ease, transform 0.25s ease-in;
}

.modal-leave-to .modal-wrapper {
  opacity: 0;
  transform: scale(0.5);
}

/* Position only — circular look comes from .btn-icon. */
.modal-close {
  position: absolute;
  z-index: 10;
  right: -0.9rem;
  top: -0.9rem;
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
