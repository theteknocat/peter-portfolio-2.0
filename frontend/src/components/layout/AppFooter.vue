<script setup lang="ts">
// Site footer: copyright year (auto-updating) + social icon links + a button
// to summon Clippy back once he's been dismissed.
import { computed } from 'vue'
import { siDrupal, siGithub } from 'simple-icons'
import { LoaderCircle, Paperclip } from '@lucide/vue'
import { stripTitle } from '@/utils/svg'
import { useClippy } from '@/composables/useClippy'

const currentYear = computed(() => new Date().getFullYear())

const { dismissed, allowed, summoning, summon } = useClippy()

// LinkedIn omitted for now — simple-icons v16 dropped the LinkedIn icon and
// @lucide/vue's export name was unresolved at build time.
// Profile URL: https://www.linkedin.com/in/peter-epp-b9390819/
// Revisit if simple-icons restores it or a reliable SVG source is found.
</script>

<template>
  <footer>
    <div class="footer-inner flex flex-col items-center gap-3 md:flex-row md:justify-between md:gap-0">
      <div class="footer-left flex items-center gap-3">
        <nav class="social-links" aria-label="Social links">
          <a v-tooltip="'Drupal.org Profile'" href="https://drupal.org/u/teknocat" class="social-link link-poly link-poly--slash shape-jitter" target="_blank" rel="noopener noreferrer">
            <span class="sr-only">Drupal.org Profile</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="stripTitle(siDrupal.svg)" class="social-icon" />
          </a>
          <a v-tooltip="'Github Profile'" href="https://github.com/teknocat" class="social-link link-poly link-poly--slash shape-jitter" target="_blank" rel="noopener noreferrer">
            <span class="sr-only">Github Profile</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="stripTitle(siGithub.svg)" class="social-icon" />
          </a>
        </nav>

        <!-- Summon Clippy back: only on viewports where he runs, and only while
             he's not already on screen. Stays visible (disabled, spinning)
             while summoning so it doesn't vanish during his reveal delay. -->
        <template v-if="allowed && (dismissed || summoning)">
          <span class="footer-divider" aria-hidden="true" />
          <button type="button" class="summon-clippy social-link link-poly link-poly--slash shape-jitter" :disabled="summoning" @click="summon">
            <LoaderCircle v-if="summoning" class="summon-spinner" :size="18" />
            <Paperclip v-else class="summon-icon" :size="18" />
            <span>{{ summoning ? 'Summoning…' : 'Need a hand?' }}</span>
          </button>
        </template>
      </div>
      <p class="copyright text-sm m-0">
        Copyright &copy; {{ currentYear }} Peter Epp
      </p>
    </div>
  </footer>
</template>

<style scoped>
@reference "tailwindcss";

footer {
  border-top: 1px solid var(--color-primary);
  background-color: var(--color-primary-dark);
}

/* Pin to viewport bottom on non-mobile; content scrolls behind the opaque bg.
   z-index sits below the header (50). */
@media (width >= theme(--breakpoint-md)) {
  footer {
    position: sticky;
    bottom: 0;
    z-index: 40;
    height: var(--footer-height);
  }
}

.footer-inner {
  max-width: 72rem;
  margin-inline: auto;
  padding: 1rem 1.5rem;
}

.copyright {
  color: var(--color-accent-lighter);
}

.social-links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.social-link {
  display: flex;
  padding: 4px 6px;
  align-items: center;
  color: var(--color-accent);
  transition: transform 0.2s ease, color 0.15s ease;
}

.social-link:hover,
.social-link:focus-visible {
  transform: scale(1.3);
  color: var(--color-primary-light);
}

.social-link:hover .social-icon,
.social-link:focus-visible .social-icon {
  animation: icon-glitch 4s linear infinite;
}

/* currentColor lets the SVG fill inherit from the link's color property */
.social-icon :deep(svg),
.social-icon :deep(svg) path {
  fill: currentColor;
}

.social-icon :deep(svg) {
  width: 1.7rem;
  height: 1.7rem;
}

/* Thin separator between the social links and the summon button. */
.footer-divider {
  width: 1px;
  height: 1.2rem;
  background: var(--color-primary);
}

/* Same look as a social link, but it carries a text label so the big
   scale(1.3) hover would be too much — dial it back. */
.summon-clippy {
  gap: 0.4rem;
  font-size: 0.95rem;
  white-space: nowrap;
  cursor: pointer;
}

.summon-clippy:hover,
.summon-clippy:focus-visible {
  transform: scale(1.05);
}

/* Disabled while summoning: no hover lift, no pointer. */
.summon-clippy:disabled {
  cursor: default;
}

.summon-clippy:disabled:hover,
.summon-clippy:disabled:focus-visible {
  transform: none;
}

.summon-icon {
  transform: rotate(-45deg);
}

.summon-spinner {
  animation: summon-spin 0.8s linear infinite;
}

@keyframes summon-spin {
  to { transform: rotate(360deg); }
}

</style>
