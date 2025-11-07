import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ArticleExtractor } from '../../src/utils/article-extractor.js'

const SAMPLE_HTML = `
<!doctype html>
<html><head><title>Sample Title</title></head>
<body>
  <nav>Nav</nav>
  <article>
    <h1>Headline</h1>
    <p>Hello.World</p>
    <aside>Ads</aside>
  </article>
  <footer>Footer</footer>
  <script>console.log('x')</script>
  <style>body{}</style>
</body></html>`

describe('ArticleExtractor', () => {
  beforeEach(() => {
    // Ensure no Readability by default
    ;(window as any).Readability = undefined
  })

  it('falls back to ContentCleaner when Readability is not present', async () => {
    // Avoid waiting on runtime loader by stubbing it to resolve false
    vi.spyOn(ArticleExtractor as any, 'ensureReadabilityLoaded').mockResolvedValue(false)
    const res = await ArticleExtractor.extract(SAMPLE_HTML, 'https://example.com/page')
    expect(res.title).toBe('Sample Title')
    expect(res.contentHTML).toContain('Headline')
    // Removed unwanted blocks
    expect(res.contentHTML).not.toContain('<nav')
    expect(res.contentHTML).not.toContain('<footer')
    // Text normalization inserts missing space after punctuation
    expect(res.text).toContain('Hello. World')
  })

  it('uses Readability when available and returns parsed content', async () => {
    // Stub Readability
    const parse = vi.fn().mockReturnValue({ title: 'R Title', content: '<p>R Text</p>' })
    ;(window as any).Readability = vi.fn(() => ({ parse }))
    const res = await ArticleExtractor.extract('<html><body><article><p>x</p></article></body></html>')
    expect(res.title).toBe('R Title')
    expect(res.contentHTML).toContain('<p>R Text</p>')
    expect(res.text).toBe('R Text')
  })
})
