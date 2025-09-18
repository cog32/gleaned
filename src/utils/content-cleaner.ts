export class ContentCleaner {
  static clean(html: string): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Remove unwanted elements
    const unwantedSelectors = [
      'nav', 'header', 'footer', 'aside',
      '.nav', '.navigation', '.menu',
      '.sidebar', '.widget', '.ads', '.advertisement',
      '.social', '.share', '.comments',
      'script', 'style', 'noscript'
    ]

    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    })

    // Find main content
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content'
    ]

    let mainContent: Element | null = null
    for (const selector of contentSelectors) {
      mainContent = doc.querySelector(selector)
      if (mainContent) break
    }

    if (!mainContent) {
      // Fallback to body content
      mainContent = doc.body
    }

    return mainContent?.innerHTML || ''
  }

  static extractText(html: string): string {
    const container = document.createElement('div')
    container.innerHTML = html
    let text = (container as any).innerText || container.textContent || ''
    text = text.replace(/\s+/g, ' ')
    // Insert space after sentence punctuation when missing; allow a closing quote/bracket in between
    text = text.replace(/([.!?\u2026])(["')\]\u201D\u2019]?)(\p{L})/gu, '$1$2 $3')
    // Repair common acronym spacing
    text = text.replace(/\b([A-Z])\. ([A-Z])\./g, '$1.$2.')
    return text.trim()
  }

  static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  static estimateReadingTime(wordCount: number, wpm: number = 250): number {
    return Math.ceil(wordCount / wpm)
  }
}
