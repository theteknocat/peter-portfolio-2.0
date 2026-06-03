export interface PageSection {
  type: string
  content?: string
  manifest?: string
  limit?: number
  filter?: string
  source?: string
}

export interface PageConfig {
  sections: PageSection[]
}
