export interface Tag {
  label: string
  si?: string     // Simple Icons slug (e.g. 'php', 'vuedotjs')
  lucide?: string // Lucide component name (e.g. 'Plug', 'Database')
  tier?: 'core' | 'extended' | 'all'
}

/** A single screenshot in a portfolio item's carousel. */
export interface PortfolioImage {
  src: string  // Bare filename; resolved to /images/content/portfolio/{slug}/{src}
  alt: string  // Required — screenshots must be described for accessibility.
  caption?: string | true  // Visible slide caption. `true` reuses `alt` verbatim.
}

/** 2+ screenshots (e.g. tall/narrow shots) stacked side-by-side into one slide. */
export interface PortfolioImageGroup {
  images: PortfolioImage[]
  caption?: string  // One caption for the whole group — no `true` shortcut (ambiguous alts).
}

/** A carousel entry: either a single image or a grouped slide. */
export type PortfolioSlideEntry = PortfolioImage | PortfolioImageGroup

/**
 * Employer attribution. Presence marks the item as work done with an employer;
 * absence reads as a personal project. `url` links to the employer's site.
 */
export interface Employer {
  name: string
  url?: string
}

export interface PortfolioItem {
  slug: string
  title: string
  summary?: string
  tags?: Tag[]
  url?: string
  featured?: boolean
  body?: string
  images?: PortfolioSlideEntry[]
  employer?: Employer
}
