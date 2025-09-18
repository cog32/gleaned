import { describe, it, expect } from 'vitest'
import { ContentCleaner } from '../../src/utils/content-cleaner.js'
import { ReadingService } from '../../src/services/reading.service.js'

const SAMPLE_HTML = `
<!doctype html>
<html>
  <head><title>Sample</title><style>.ads{display:none}</style></head>
  <body>
    <header>Site Header 11:00</header>
    <nav>Main Nav</nav>
    <aside>Sidebar 3</aside>
    <main>
      <article>
        <h1>Meaningful Title</h1>
        <p>The quick brown fox jumps over the lazy dog.</p>
        <p>It happened on a fine day in September.</p>
      </article>
    </main>
    <footer>© 2025</footer>
  </body>
 </html>`

describe('ContentCleaner + ReadingService integration', () => {
  it('extracts main content and produces readable words (no pure numbers, spacing preserved)', () => {
    const cleaned = ContentCleaner.clean(SAMPLE_HTML)
    const text = ContentCleaner.extractText(cleaned)
    expect(text).toContain('Meaningful Title')
    expect(text).toContain('quick brown fox')

    const svc = new ReadingService()
    const words = svc.processText(cleaned)
    const texts = words.map(w => w.text)
    
    // Should not include pure numeric tokens
    expect(texts.some(t => /^\d+$/.test(t))).toBeFalsy()
    // No smashed words
    expect(text).not.toMatch(/quickbrown/)
    expect(text).not.toMatch(/dogIt/)
    // Should include key content words
    expect(texts).toContain('quick')
    expect(texts).toContain('brown')
    expect(texts).toContain('fox')
    expect(texts).toContain('September.') // punctuation preserved on original word
  })
})
