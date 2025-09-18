export interface Article {
  id: string
  title: string
  author?: string
  source: string
  url: string
  dateAdded: string
  readingTime: number
  wordCount: number
  content: string
  cleanedContent: string
}

export interface ContentExtractionResult {
  title: string
  author?: string
  content: string
  wordCount: number
}