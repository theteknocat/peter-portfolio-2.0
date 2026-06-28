<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import LoadingScreen from '@/components/layout/LoadingScreen.vue'
import ModalOverlay from '@/components/layout/ModalOverlay.vue'
import ClippyCompanion from '@/components/clippy/ClippyCompanion.vue'
import { useBackgroundGlitch } from '@/composables/useBackgroundGlitch'
import { useBackgroundStreaks } from '@/composables/useBackgroundStreaks'
import { setNonModalPath } from '@/composables/useModalNavigation'

const route = useRoute()
const bgContainer = ref<HTMLElement | null>(null)
const streakSvg = ref<SVGSVGElement | null>(null)

useBackgroundGlitch(bgContainer)
useBackgroundStreaks(streakSvg)

// Keep the page slot stable while a modal is open. Stripping the slug only
// works when the modal is a child of the current page — opening a portfolio
// modal from the home page would still change the key. Instead, snapshot the
// path whenever we're NOT in a modal and reuse it while a modal is active.
const pageKey = ref(route.path)
watch(
  () => route.path,
  (path) => {
    if (!route.meta.modal) {
      pageKey.value = path
      setNonModalPath(path)
    }
  },
  { immediate: true },
)

watch(
  () => route.meta.modal,
  (isModal) => {
    if (isModal && typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--page-scroll-y', `${window.scrollY}px`)
    }
  },
)

// The RouterView slot Component is only accessible in the template, not in
// script. We capture it here during render so the background page stays frozen
// (whatever page was active before the modal opened) rather than switching to
// the modal route's default component (e.g. PortfolioView when opening from /).
//
// Writing to a shallowRef during render is an anti-pattern in general, but safe
// here: the write is guarded by !isModal, so frozenComponent is never updated
// while a modal is active (including modal-to-modal navigation). The guard runs
// synchronously and Vue navigation guards prevent concurrent transitions, so
// there is no race between the write and the modal opening.
//
// The alternative — reading route.matched in a watcher — doesn't work because
// modal routes are nested children of page routes, so the background page's
// component isn't present in the match records when a modal is open.
const frozenComponent = shallowRef<object | null>(null)
function backgroundComponent(comp: object | null, isModal: boolean): object | null {
  if (!isModal && comp) frozenComponent.value = comp
  return isModal ? frozenComponent.value : comp
}
</script>

<template>
  <!-- .page-scene holds the perspective context for the recede animation.
       .page-layer is what actually transforms when a modal is open. -->
  <div class="page-scene">
    <div class="page-layer" :class="{ 'is-modal-open': route.meta.modal }">
      <!-- Background layer + glitch slices inside .page-layer so they recede
           with the page when a modal opens. position:fixed on these elements
           fixes to .page-layer's coordinate space when it has an active transform,
           and to the viewport when it doesn't — no CSS changes needed. -->
      <div ref="bgContainer" class="bg-container" aria-hidden="true">
        <div class="bg-layer"></div>
        <div v-for="n in 4" :key="n" class="bg-spot">
          <div class="bg-spot-inner"></div>
        </div>
        <div class="bg-streak-overlay">
          <svg ref="streakSvg" width="100%" height="100%" aria-hidden="true"></svg>
        </div>
      </div>

      <AppHeader />
      <main>
        <!-- v-slot extracts the route component vnode directly so <Transition>
             sees it as an immediate child — wrapping <RouterView> directly hides
             the component behind a renderless wrapper and transition classes miss. -->
        <RouterView v-slot="{ Component }">
          <Transition name="page" :duration="{ enter: 1500, leave: 300 }">
            <!-- page-slot is a plain full-width wrapper so position:absolute on
                 .page-leave-active doesn't disrupt .view-container's centering -->
            <div class="page-slot" :key="pageKey">
              <component :is="backgroundComponent(Component, !!route.meta.modal)" />
            </div>
          </Transition>
        </RouterView>
      </main>
      <AppFooter />
    </div>
  </div>

  <!-- ModalOverlay is a sibling of .page-scene so it has its own 3D context
       and sits outside the page recede transform entirely. -->
  <ModalOverlay />
  <LoadingScreen />
  <ClippyCompanion />
</template>

<style scoped>
.page-layer {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transform: none;
  /* scale origin should be viewport centre, not document top */
  transform-origin: 50vw calc(var(--page-scroll-y, 0px) + 50vh);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.2s;
}

.page-layer.is-modal-open {
  /* clip-path shows exactly scrollY → scrollY+100vh */
  clip-path: inset(var(--page-scroll-y, 0px) 0 calc(100% - var(--page-scroll-y, 0px) - 100vh) 0);
  transform: scale(0.92);
  transition: transform 0.2s ease;
}

main {
  flex: 1;
  position: relative; /* anchors .page-leave-active absolute positioning */
  overflow-x: clip;
}

/* Hide immediately when modal opens; restore only after the page-layer
   return transition completes (0.4s + 0.2s delay = 0.6s). */
.page-layer .bg-streak-overlay,
.page-layer .bg-spot {
  transition: visibility 0s 0.65s;
}

.page-layer.is-modal-open .bg-streak-overlay,
.page-layer.is-modal-open .bg-spot {
  visibility: hidden;
  transition: visibility 0s;
}
</style>
