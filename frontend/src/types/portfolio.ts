export interface Tag {
  label: string
  si?: string     // Simple Icons slug (e.g. 'php', 'vuedotjs')
  lucide?: string // Lucide component name (e.g. 'Plug', 'Database')
}

/** A single screenshot in a portfolio item's carousel. */
export interface PortfolioImage {
  src: string  // Bare filename; resolved to /images/content/portfolio/{slug}/{src}
  alt: string  // Required — screenshots must be described for accessibility.
}

export interface PortfolioItem {
  slug: string
  title: string
  summary?: string
  tags?: Tag[]
  github?: string
  featured?: boolean
  body?: string
  images?: PortfolioImage[]
}
