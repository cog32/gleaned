import { ContentCleaner } from '../utils/content-cleaner.js'
import type { ContentExtractionResult } from '../types/content.js'

export class ContentService {
  async extractContent(url: string): Promise<ContentExtractionResult> {
    // Demo content for testing
    if (url.includes('demo') || url.includes('test')) {
      return this.getDemoContent()
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status}`)
      }

      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // Extract title
      const title = this.extractTitle(doc)

      // Extract author
      const author = this.extractAuthor(doc)

      // Clean content
      const cleanedContent = ContentCleaner.clean(html)
      const textContent = ContentCleaner.extractText(cleanedContent)
      const wordCount = ContentCleaner.countWords(textContent)

      return {
        title,
        author,
        content: cleanedContent,
        wordCount
      }
    } catch (error) {
      throw new Error(`Content extraction failed: CORS error - try using "demo" as the URL for testing, or use a browser extension to bypass CORS restrictions`)
    }
  }

  private getDemoContent(): ContentExtractionResult {
    const content = `
      <div style="text-align: center; margin: 2rem 0;">
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjVmNWY1Ii8+CjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPgo8cmVjdCB4PSIxNzAiIHk9IjUwIiB3aWR0aD0iODAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZGM0YTZiIi8+CjxyZWN0IHg9IjEwMCIgeT0iODAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2Y1OWU0MiIvPgo8dGV4dCB4PSIxNTAiIHk9IjE4MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNhbXBsZSBJbWFnZTwvdGV4dD4KPHN2Zz4=" alt="Sample painting" style="max-width: 300px; border-radius: 8px;" />
      </div>
      
      <p>This is a demo article showing how Gleaned cleans up web content for distraction-free reading. The interface removes navigation, ads, and other clutter to focus on the core content.</p>
      
      <p>With your help, we have raised over $277,000 (across multiple charities) to help Israel cope with the Hamas atrocities. The offer still stands: If you donate $100 or more to any of the charities listed here, I'll send you a signed copy of my book.</p>
      
      <p>This demo content shows how articles are processed and displayed with clean typography and optimal reading layout. The reading time is calculated based on average reading speed of 250 words per minute.</p>
      
      <h3>Key Features</h3>
      <ul>
        <li>Clean content extraction</li>
        <li>Automatic reading time calculation</li>
        <li>Responsive design</li>
        <li>Progressive Web App capabilities</li>
      </ul>
      
      <p>In a real deployment, you would need either a backend service to fetch content or browser extensions to bypass CORS restrictions when accessing external websites.</p>
    `

    const textContent = ContentCleaner.extractText(content)
    const wordCount = ContentCleaner.countWords(textContent)

    return {
      title: 'Thoughts on AI and Middle East Conflict (Demo)',
      author: 'Vitaly Katsenelson',
      content,
      wordCount
    }
  }

  private extractTitle(doc: Document): string {
    const titleSelectors = [
      'h1',
      '.title',
      '.post-title',
      '.entry-title',
      '.article-title',
      'title'
    ]

    for (const selector of titleSelectors) {
      const element = doc.querySelector(selector)
      if (element?.textContent?.trim()) {
        return element.textContent.trim()
      }
    }

    return 'Untitled Article'
  }

  private extractAuthor(doc: Document): string | undefined {
    const authorSelectors = [
      '.author',
      '.byline',
      '.post-author',
      '.article-author',
      '[rel="author"]',
      '.writer',
      '[itemprop="author"]'
    ]

    for (const selector of authorSelectors) {
      const element = doc.querySelector(selector)
      if (element?.textContent?.trim()) {
        return element.textContent.trim()
      }
    }

    return undefined
  }
}