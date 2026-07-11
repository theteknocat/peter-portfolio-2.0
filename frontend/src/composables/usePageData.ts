import { ref } from 'vue'
import type { PageData } from '@/types/page'

/**
 * Fetches the fully-resolved page data from `/api/page/{page}`.
 *
 * Awaited during `setup()` (async setup, requires a `<Suspense>` ancestor) so
 * the data is present in prerendered SSG output, not just client-side.
 *
 * @param page - The page name matching a layout file (e.g. `'home'`).
 * @returns Reactive refs for the page data and any error message.
 */
export async function usePageData(page: string) {
  const data = ref<PageData | null>(null)
  const error = ref<string | null>(null)

  try {
    const base = import.meta.env.SSR ? 'http://localhost' : ''
    const response = await fetch(`${base}/api/page/${page}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    data.value = await response.json() as PageData
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  }

  return { data, error }
}
