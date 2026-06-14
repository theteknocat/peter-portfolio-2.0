<script setup lang="ts">
// Sticky site header. Picks up scroll position from useScrolled and
// applies the .scrolled class to trigger blur + transparency.
import { RouterLink } from 'vue-router'
import { useScrolled } from '@/composables/useScrolled'
import logoSrc from '@/assets/logo.jpg'

const { isScrolled } = useScrolled()
</script>

<template>
  <header :class="{ scrolled: isScrolled }">
    <div class="header-inner">
      <RouterLink to="/" class="site-brand link-poly link-poly--slash link-poly--twist">
        <img :src="logoSrc" alt="Peter Epp" class="brand-logo" />
        <span class="brand-name">Peter Epp</span>
      </RouterLink>
      <nav class="flex gap-2">
        <RouterLink to="/portfolio" class="nav-link link-poly link-poly--slash link-poly--twist">Portfolio</RouterLink>
        <RouterLink to="/articles" class="nav-link link-poly link-poly--slash link-poly--twist">Articles</RouterLink>
        <RouterLink to="/job-history" class="nav-link link-poly link-poly--slash link-poly--twist">Job History</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--color-primary-dark);
  border-bottom: 1px solid var(--color-primary);
  transition:
    background-color 0.3s cubic-bezier(0.19, 1, 0.22, 1),
    box-shadow 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

/* Marble texture lives here, not on the element itself, so backdrop-filter
   can blur what's behind the transparent header bg without being blocked
   by the texture. Opacity transitions from 1 → 0.5 when scrolled. */
header::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/images/green-marble-texture.jpg');
  background-repeat: repeat;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
  pointer-events: none;
}

header.scrolled {
  background-color: rgba(0, 45, 22, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
}

header.scrolled::before {
  opacity: 0.5;
}

.header-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 72rem;
  margin-inline: auto;
  padding: 0.75rem 1.5rem;
}

.site-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  padding: 0 0.625rem;
}

.brand-logo {
  width: 50px;
  height: 50px;
  border-radius: 5px;
  border: 1px solid var(--color-primary);
  object-fit: cover;
  flex-shrink: 0;
}

.brand-name {
  font-family: var(--font-display);
  color: var(--color-accent-lighter);
  font-size: 2rem;
  white-space: nowrap;
}
</style>
