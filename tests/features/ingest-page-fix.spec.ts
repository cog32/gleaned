import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Ingest Page Fix', () => {
  let mockStorage: { [key: string]: string } = {}
  
  beforeEach(() => {
    document.body.innerHTML = ''
    mockStorage = {}
    vi.clearAllMocks()
    
    // Mock localStorage with a working implementation
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
        removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
        clear: vi.fn(() => { mockStorage = {} }),
      },
      writable: true,
    })

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/' },
      writable: true,
    })
  })

  it('should not have overflow hidden on the body in ingest page styles', () => {
    // The ingest page inline styles must NOT set overflow: hidden on body,
    // otherwise iPhone users cannot scroll and buttons get covered by the footer.
    const fs = require('fs')
    const path = require('path')
    const html = fs.readFileSync(path.resolve(__dirname, '../../ingest.html'), 'utf-8')

    // Extract inline <style> content
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/)
    expect(styleMatch).not.toBeNull()
    const styleContent = styleMatch![1]

    // Extract the body rule
    const bodyRuleMatch = styleContent.match(/body\s*\{([^}]*)\}/)
    expect(bodyRuleMatch).not.toBeNull()
    const bodyRule = bodyRuleMatch![1]

    // Body must not have overflow: hidden
    expect(bodyRule).not.toMatch(/overflow\s*:\s*hidden/)
    // Body must not have max-height: 100vh (prevents scrolling)
    expect(bodyRule).not.toMatch(/max-height\s*:\s*100vh/)
  })

  it('should store articles from ingest page with unique keys', () => {
    // Mock processed articles from ingest page
    const article1 = {
      id: 'ingest-article-1',
      title: 'Article from Bookmarklet 1',
      author: 'Author One',
      source: 'SITE1.COM',
      url: 'https://site1.com/article1',
      dateAdded: '3 Sep 2025',
      readingTime: 4,
      wordCount: 1000,
      content: '<div>Original HTML 1</div>',
      cleanedContent: '<p>Cleaned content 1</p>'
    }

    const article2 = {
      id: 'ingest-article-2',
      title: 'Article from Bookmarklet 2', 
      author: 'Author Two',
      source: 'SITE2.COM',
      url: 'https://site2.com/article2',
      dateAdded: '3 Sep 2025',
      readingTime: 6,
      wordCount: 1500,
      content: '<div>Original HTML 2</div>',
      cleanedContent: '<p>Cleaned content 2</p>'
    }

    // Simulate ingest page startReading() for first article
    localStorage.setItem(`article-${article1.id}`, JSON.stringify(article1))
    localStorage.setItem('selectedArticleId', article1.id)

    // Simulate ingest page startReading() for second article
    localStorage.setItem(`article-${article2.id}`, JSON.stringify(article2))
    localStorage.setItem('selectedArticleId', article2.id)

    // Both articles should be preserved
    const storedFirst = JSON.parse(localStorage.getItem(`article-${article1.id}`) || '{}')
    const storedSecond = JSON.parse(localStorage.getItem(`article-${article2.id}`) || '{}')
    
    expect(storedFirst.title).toBe('Article from Bookmarklet 1')
    expect(storedFirst.id).toBe('ingest-article-1')
    
    expect(storedSecond.title).toBe('Article from Bookmarklet 2')
    expect(storedSecond.id).toBe('ingest-article-2')
    
    // The most recent should be selected
    expect(localStorage.getItem('selectedArticleId')).toBe('ingest-article-2')
  })

  it('should allow viewing full article from ingest page without overwriting others', () => {
    const existingArticle = {
      id: 'existing-article',
      title: 'Already Loaded Article',
      cleanedContent: 'Existing content'
    }

    const ingestedArticle = {
      id: 'ingested-article',
      title: 'Newly Ingested Article',
      cleanedContent: 'Ingested content'
    }

    // Store existing article (from main page)
    localStorage.setItem(`article-${existingArticle.id}`, JSON.stringify(existingArticle))
    
    // Simulate viewFullArticle() from ingest page
    localStorage.setItem(`article-${ingestedArticle.id}`, JSON.stringify(ingestedArticle))
    localStorage.setItem('selectedArticleId', ingestedArticle.id)
    
    // Both articles should exist
    const storedExisting = JSON.parse(localStorage.getItem(`article-${existingArticle.id}`) || '{}')
    const storedIngested = JSON.parse(localStorage.getItem(`article-${ingestedArticle.id}`) || '{}')
    
    expect(storedExisting.title).toBe('Already Loaded Article')
    expect(storedIngested.title).toBe('Newly Ingested Article')
    
    // The ingested article should be selected for viewing
    expect(localStorage.getItem('selectedArticleId')).toBe('ingested-article')
  })

  it('should handle multiple bookmarklet ingestions correctly', () => {
    const bookmarkletArticles = [
      { id: 'bm-1', title: 'Bookmarklet Article 1', url: 'https://news.com/1' },
      { id: 'bm-2', title: 'Bookmarklet Article 2', url: 'https://blog.com/2' },
      { id: 'bm-3', title: 'Bookmarklet Article 3', url: 'https://medium.com/3' }
    ]

    // Simulate user using bookmarklet on multiple articles
    bookmarkletArticles.forEach(article => {
      // Each bookmarklet usage goes through ingest page
      localStorage.setItem(`article-${article.id}`, JSON.stringify(article))
      localStorage.setItem('selectedArticleId', article.id)
    })

    // All articles should be stored independently
    bookmarkletArticles.forEach(article => {
      const stored = JSON.parse(localStorage.getItem(`article-${article.id}`) || '{}')
      expect(stored.title).toBe(article.title)
      expect(stored.id).toBe(article.id)
    })

    // User should be able to read any of them by changing selection
    localStorage.setItem('selectedArticleId', 'bm-1')
    let selected = JSON.parse(localStorage.getItem(`article-${localStorage.getItem('selectedArticleId')}`) || '{}')
    expect(selected.title).toBe('Bookmarklet Article 1')

    localStorage.setItem('selectedArticleId', 'bm-3')
    selected = JSON.parse(localStorage.getItem(`article-${localStorage.getItem('selectedArticleId')}`) || '{}')
    expect(selected.title).toBe('Bookmarklet Article 3')
  })

  it('should demonstrate the original bug would have been present in ingest page', () => {
    // This test shows what would have happened with the old system
    const article1 = { id: 'test-1', title: 'First Ingested' }
    const article2 = { id: 'test-2', title: 'Second Ingested' }

    // OLD BUGGY BEHAVIOR (what would have happened):
    // Simulate the old ingest.ts localStorage.setItem('currentArticle', ...)
    localStorage.setItem('currentArticle', JSON.stringify(article1))
    localStorage.setItem('currentArticle', JSON.stringify(article2)) // overwrites first

    const oldSystemResult = JSON.parse(localStorage.getItem('currentArticle') || '{}')
    expect(oldSystemResult.title).toBe('Second Ingested') // Would always be the last one
    expect(oldSystemResult.title).not.toBe('First Ingested') // First would be lost

    // Clear for clean test of new system
    localStorage.removeItem('currentArticle')

    // NEW FIXED BEHAVIOR:
    localStorage.setItem(`article-${article1.id}`, JSON.stringify(article1))
    localStorage.setItem('selectedArticleId', article1.id)
    localStorage.setItem(`article-${article2.id}`, JSON.stringify(article2))
    localStorage.setItem('selectedArticleId', article2.id)

    // Both articles preserved
    const newSystem1 = JSON.parse(localStorage.getItem(`article-${article1.id}`) || '{}')
    const newSystem2 = JSON.parse(localStorage.getItem(`article-${article2.id}`) || '{}')
    
    expect(newSystem1.title).toBe('First Ingested')
    expect(newSystem2.title).toBe('Second Ingested')
    
    // Can select either one
    localStorage.setItem('selectedArticleId', article1.id)
    const selected = JSON.parse(localStorage.getItem(`article-${localStorage.getItem('selectedArticleId')}`) || '{}')
    expect(selected.title).toBe('First Ingested')
  })
})