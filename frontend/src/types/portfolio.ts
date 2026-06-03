export interface GalleryImage {
  filename: string
  alt: string
}

export interface PortfolioItem {
  slug: string
  title: string
  date_start: number | string
  date_end: number | string
  featured: boolean
  external_url?: string
  technologies: string[]
  summary: string
  body?: string
  gallery?: GalleryImage[]
}
