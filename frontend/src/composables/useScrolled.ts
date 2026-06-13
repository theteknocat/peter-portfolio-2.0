import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Tracks whether the page has been scrolled past the threshold.
 *
 * @param threshold - Scroll distance in pixels before `isScrolled` becomes true.
 * @returns A reactive boolean ref.
 */
export function useScrolled(threshold = 10) {
  const isScrolled = ref<boolean>(false)

  const onScroll = (): void => {
    isScrolled.value = window.scrollY > threshold
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })

  return { isScrolled }
}
