<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ModalOverlay from '@/components/layout/ModalOverlay.vue'
</script>

<template>
  <div class="app-wrapper">
    <AppHeader />
    <main>
      <!-- Page transitions will be wired to this Transition once ContentCard
           is confirmed. The name="page" prefix maps to .page-* CSS classes. -->
      <Transition name="page" mode="out-in">
        <RouterView />
      </Transition>
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
}

/* Placeholder page transition — simple fade until 3D transforms are wired up */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
