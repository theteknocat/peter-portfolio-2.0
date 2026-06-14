<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ModalOverlay from '@/components/layout/ModalOverlay.vue'
import { useBackgroundGlitch } from '@/composables/useBackgroundGlitch'

const route = useRoute()
const bgContainer = ref<HTMLElement | null>(null)

useBackgroundGlitch(bgContainer)
</script>

<template>
  <!-- Background layer + glitch slices: aria-hidden, pointer-events blocked in CSS -->
  <div ref="bgContainer" aria-hidden="true">
    <div class="bg-layer" />
    <div v-for="n in 4" :key="n" class="bg-spot">
      <div class="bg-spot-inner" />
    </div>
  </div>
  <div class="app-wrapper">
    <AppHeader />
    <main>
      <!-- v-slot extracts the route component vnode directly so <Transition>
           sees it as an immediate child — wrapping <RouterView> directly hides
           the component behind a renderless wrapper and transition classes miss. -->
      <RouterView v-slot="{ Component }">
        <Transition name="page" :duration="{ enter: 700, leave: 500 }">
          <!-- page-slot is a plain full-width wrapper so position:absolute on
               .page-leave-active doesn't disrupt .view-container's centering -->
          <div class="page-slot" :key="route.path">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </main>
    <AppFooter />
    <!-- Modal overlay sits outside <main> so it can cover the full viewport -->
    <ModalOverlay />
  </div>
</template>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  position: relative; /* anchors .page-leave-active absolute positioning */
}

/* Positioning moved to main.css as global rules — scoped CSS won't reach
   the route component's root element across the RouterView boundary. */
</style>
