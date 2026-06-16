import { onMounted, ref } from 'vue'
import type { PageData } from '@/types/page'

/**
 * Fetches the fully-resolved page data from `/api/page/{page}`.
 *
 * Returns reactive `data`, `loading`, and `error` refs. The fetch runs once
 * when the component mounts. Section components receive their slice of `data`
 * as props and render whatever the API resolved.
 *
 * @param page - The page name matching a layout file (e.g. `'home'`).
 * @returns Reactive refs for the page data, loading state, and any error message.
 */
export function usePageData(page: string) {
  const data = ref<PageData | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const response = await fetch(`/api/page/${page}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json() as PageData
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  })

  return { data, loading, error }
}
