import { ref } from 'vue'
import type { Router } from 'vue-router'

/**
 * Module-level singleton — shared across all callers in the same app instance.
 * Tracks the last non-modal path so the modal close button can return there
 * rather than relying on router.back(), which does nothing on a direct/refresh load.
 */
const previousNonModalPath = ref<string | null>(null)

/**
 * Strips the last path segment: '/portfolio/my-slug' → '/portfolio'.
 * Used as the close destination when no prior navigation exists.
 */
function deriveParentPath(path: string): string {
  const segments = path.split('/').filter(Boolean)
  segments.pop()
  return '/' + segments.join('/')
}

/**
 * Records the current non-modal path. Call this whenever the route changes
 * and the new route is not a modal.
 *
 * @param path - The current non-modal route path.
 */
export function setNonModalPath(path: string): void {
  previousNonModalPath.value = path
}

/**
 * Navigates away from the current modal route.
 * Returns to the last non-modal path if one was recorded, otherwise derives
 * the parent route by stripping the final path segment.
 *
 * @param router - The Vue Router instance.
 * @param currentPath - The current modal route path (used to derive parent).
 */
export function closeModal(router: Router, currentPath: string): void {
  const target = previousNonModalPath.value ?? deriveParentPath(currentPath)
  router.push(target)
}
