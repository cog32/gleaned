// Lightweight wrapper to extract main article content with optional Readability
// Falls back to our ContentCleaner if Readability is not present.

import { ContentCleaner } from './content-cleaner.js'

type ExtractResult = {
  title: string
  contentHTML: string
  text: string
}

declare global {
  interface Window { Readability?: any }
}

export const ArticleExtractor = {
  async extract(html: string, url?: string): Promise<ExtractResult> {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // If URL known, add <base> for relative link resolution
      if (url) {
        const base = doc.createElement('base')
        base.href = url
        doc.head.prepend(base)
      }

      // Use Readability if available (global); if not, try to load it
      if (typeof window !== 'undefined' && !(window as any).Readability) {
        await this.ensureReadabilityLoaded()
      }
      if (typeof window !== 'undefined' && (window as any).Readability) {
        const article = new (window as any).Readability(doc).parse()
        if (article?.content) {
          const contentHTML = String(article.content)
          const text = this.htmlToInnerText(contentHTML)
          return {
            title: article.title || doc.title || 'Untitled Article',
            contentHTML,
            text
          }
        }
      }

      // Fallback to ContentCleaner
      const cleaned = ContentCleaner.clean(html)
      const text = ContentCleaner.extractText(cleaned)
      return {
        title: doc.title || 'Untitled Article',
        contentHTML: cleaned,
        text
      }
    } catch {
      const cleaned = ContentCleaner.clean(html)
      const text = ContentCleaner.extractText(cleaned)
      return { title: 'Untitled Article', contentHTML: cleaned, text }
    }
  },

  htmlToInnerText(html: string): string {
    const container = document.createElement('div')
    container.innerHTML = html
    let text = (container as any).innerText || container.textContent || ''
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ')
    // Ensure a space after sentence-ending punctuation if missing.
    // Handles optional closing quotes/brackets and any Unicode letter next.
    // Examples: "end.Next" => "end. Next", 'end."Next' => 'end." Next'
    text = text.replace(/([.!?\u2026])(["')\]\u201D\u2019]?)(\p{L})/gu, '$1$2 $3')
    // Repair common acronym patterns accidentally spaced (e.g., "U. S.")
    text = text.replace(/\b([A-Z])\. ([A-Z])\./g, '$1.$2.')
    return text.trim()
  },

  // Optional loader to bring Readability in at runtime (best-effort)
  async ensureReadabilityLoaded(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    if ((window as any).Readability) return true
    const origin = location.origin
    const candidates = [
      `${origin}/vendor/Readability.js`,
      `${origin}/vendor/readability.js`
    ]
    for (const src of candidates) {
      const ok = await this.loadScript(src)
      if (ok && (window as any).Readability) return true
    }
    return false
  },

  loadScript(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const s = document.createElement('script')
        s.src = src
        s.async = true
        s.onload = () => resolve(true)
        s.onerror = () => resolve(false)
        document.head.appendChild(s)
      } catch {
        resolve(false)
      }
    })
  }
}
