import { onMounted, ref } from 'vue'

/**
 * Fetches a single content item from `/api/content/{type}/{slug}`.
 *
 * The generic `T` parameter lets callers type the returned data ref to their
 * specific content type (e.g. `useContent<PortfolioItem>('portfolio', slug)`).
 * This is the same `ref + onMounted + fetch` pattern as `usePageData`, but for
 * individual item routes rather than full page layouts.
 *
 * @param type - The content type directory name (e.g. `'portfolio'`, `'articles'`).
 * @param slug - The item slug matching the YAML filename without extension.
 * @returns Reactive refs for the item data, loading state, and any error message.
 */
export function useContent<T>(type: string, slug: string) {
  const data = ref<T | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  onMounted(async () => {
    try {
      const response = await fetch(`/api/content/${type}/${slug}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json() as T
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  })

  return { data, loading, error }
}
