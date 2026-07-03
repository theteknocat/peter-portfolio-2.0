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
}

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
  images?: PortfolioImage[]
  employer?: Employer
}
