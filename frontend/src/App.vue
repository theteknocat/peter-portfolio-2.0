<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import LoadingScreen from '@/components/layout/LoadingScreen.vue'
import ModalOverlay from '@/components/layout/ModalOverlay.vue'
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

// The RouterView slot Component is only accessible in the template, not in
// script. We capture it here during render so the background page stays frozen
// (whatever page was active before the modal opened) rather than switching to
// the modal route's default component (e.g. PortfolioView when opening from /).
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
          <Transition name="page" :duration="{ enter: 700, leave: 500 }">
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
</template>

<style scoped>
.page-scene {
  perspective: 1000px;
}

.page-layer {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-shadow: none;
  transform-origin: 50vw 50vh;
  /* Return transition — applied when .is-modal-open is removed */
  transition: transform 1s cubic-bezier(0.22, 1, 0.36, 1), filter 1s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-layer.is-modal-open {
  transform: translate(calc(35vw - 5rem), calc(-35vh + 2rem)) scale(0.30) rotateY(-5deg) rotateX(-2deg);
  filter: brightness(0.65);
  box-shadow: 0 0 2px 1px var(--color-border);
  /* Exit transition — applied when .is-modal-open is added */
  transition: transform 0.35s ease, filter 0.35s ease, box-shadow 0.35s ease;
}

main {
  flex: 1;
  position: relative; /* anchors .page-leave-active absolute positioning */
}

/* Hide immediately when modal opens, restore only after the page-layer
   transition completes (0.35s) to avoid rendering during the animation. */
.page-layer .bg-streak-overlay,
.page-layer .bg-spot {
  transition: visibility 0s 0.35s;
}

.page-layer.is-modal-open .bg-streak-overlay,
.page-layer.is-modal-open .bg-spot {
  visibility: hidden;
  transition: visibility 0s;
}
</style>
