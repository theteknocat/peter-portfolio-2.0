/**
 * API response types for page data — what `/api/page/{page}` returns.
 * These are the resolved shapes after the backend has expanded layouts,
 * manifests, and content files. Not to be confused with the YAML layout
 * structure, which is a backend concern only.
 */

export interface ResolvedSection {
  type: string
  /** Present on source sections — a single resolved content item, or null if the file is missing. */
  content?: Record<string, unknown> | null
  /**
   * Present on manifest sections — the resolved list of content items.
   *
   * Typed loosely because the API can return any content shape depending on
   * section type. Callers cast to the concrete type at point of use via
   * `as unknown as T[]`. Shape correctness is guaranteed by the PHP backend;
   * there is no runtime validation on the frontend.
   */
  items?: Record<string, unknown>[]
}

export interface PageData {
  page: string
  sections: ResolvedSection[]
}
