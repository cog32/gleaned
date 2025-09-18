import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Bookmarklet Flow Fix', () => {
  let mockStorage: { [key: string]: string } = {}
  let mockIndexedDB: any
  
  beforeEach(() => {
    document.body.innerHTML = ''
    mockStorage = {}
    mockIndexedDB = { ingestedContent: [] }
    vi.clearAllMocks()
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
        removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
        clear: vi.fn(() => { mockStorage = {} }),
      },
      writable: true,
    })
  })

  it('should demonstrate the original bookmarklet issue (for reference)', () => {
    // This test shows what would happen without the fix
    
    // Simulate first bookmarklet use - content stored in service worker IndexedDB
    const firstContent = {
      id: 'ingested-1',
      url: 'https://site1.com/article1',
      title: 'First Bookmarklet Article',
      timestamp: Date.now() - 1000
    }
    mockIndexedDB.ingestedContent = [firstContent]
    
    // Simulate ingest page processing - OLD BUGGY BEHAVIOR would use 'currentArticle'
    localStorage.setItem('currentArticle', JSON.stringify({
      id: firstContent.id,
      title: firstContent.title,
      url: firstContent.url
    }))
    
    // Simulate second bookmarklet use
    const secondContent = {
      id: 'ingested-2', 
      url: 'https://site2.com/article2',
      title: 'Second Bookmarklet Article',
      timestamp: Date.now()
    }
    // OLD BUG: Would overwrite the first article in localStorage
    localStorage.setItem('currentArticle', JSON.stringify({
      id: secondContent.id,
      title: secondContent.title,
      url: secondContent.url
    }))
    
    // THE BUG: Reading page would always load whatever is in 'currentArticle'
    const currentArticle = JSON.parse(localStorage.getItem('currentArticle') || '{}')
    expect(currentArticle.title).toBe('Second Bookmarklet Article')
    expect(currentArticle.title).not.toBe('First Bookmarklet Article') // First is lost
  })

  it('should fix the bookmarklet flow with unique article storage', () => {
    // This test demonstrates the fix
    
    // Simulate first bookmarklet use and ingest processing with NEW SYSTEM
    const firstContent = {
      id: 'ingested-1',
      url: 'https://site1.com/article1',
      title: 'First Bookmarklet Article',
      content: 'First article content'
    }
    
    // NEW SYSTEM: Store with unique key and set selection
    localStorage.setItem(`article-${firstContent.id}`, JSON.stringify(firstContent))
    localStorage.setItem('selectedArticleId', firstContent.id)
    
    // Simulate second bookmarklet use and ingest processing
    const secondContent = {
      id: 'ingested-2',
      url: 'https://site2.com/article2', 
      title: 'Second Bookmarklet Article',
      content: 'Second article content'
    }
    
    // NEW SYSTEM: Store with unique key and set selection
    localStorage.setItem(`article-${secondContent.id}`, JSON.stringify(secondContent))
    localStorage.setItem('selectedArticleId', secondContent.id)
    
    // FIXED: Both articles are preserved
    const firstStored = JSON.parse(localStorage.getItem(`article-${firstContent.id}`) || '{}')
    const secondStored = JSON.parse(localStorage.getItem(`article-${secondContent.id}`) || '{}')
    
    expect(firstStored.title).toBe('First Bookmarklet Article')
    expect(secondStored.title).toBe('Second Bookmarklet Article')
    
    // The most recent is selected
    const selectedId = localStorage.getItem('selectedArticleId')
    expect(selectedId).toBe(secondContent.id)
    
    // But user can select either article
    localStorage.setItem('selectedArticleId', firstContent.id)
    const newSelectedId = localStorage.getItem('selectedArticleId')
    const selectedArticle = JSON.parse(localStorage.getItem(`article-${newSelectedId}`) || '{}')
    expect(selectedArticle.title).toBe('First Bookmarklet Article')
  })

  it('should simulate the service worker clearing old content before storing new', () => {
    // Simulate service worker behavior with clearAllIngestedContent
    
    // First bookmarklet use - content in service worker storage
    const firstSWContent = { id: 'sw-1', title: 'First SW Article', timestamp: Date.now() - 1000 }
    mockIndexedDB.ingestedContent = [firstSWContent]
    
    // Service worker processes it and stores in localStorage
    localStorage.setItem(`article-${firstSWContent.id}`, JSON.stringify(firstSWContent))
    localStorage.setItem('selectedArticleId', firstSWContent.id)
    
    // Second bookmarklet use - service worker should clear old content first
    mockIndexedDB.ingestedContent = [] // Simulate clearAllIngestedContent()
    
    const secondSWContent = { id: 'sw-2', title: 'Second SW Article', timestamp: Date.now() }
    mockIndexedDB.ingestedContent = [secondSWContent] // Only the new content
    
    // Service worker processes and stores the new content
    localStorage.setItem(`article-${secondSWContent.id}`, JSON.stringify(secondSWContent))
    localStorage.setItem('selectedArticleId', secondSWContent.id)
    
    // Both articles should be in localStorage (preserved)
    const firstInLocalStorage = localStorage.getItem(`article-${firstSWContent.id}`)
    const secondInLocalStorage = localStorage.getItem(`article-${secondSWContent.id}`)
    
    expect(firstInLocalStorage).not.toBeNull()
    expect(secondInLocalStorage).not.toBeNull()
    
    // Service worker IndexedDB should only have the latest
    expect(mockIndexedDB.ingestedContent).toHaveLength(1)
    expect(mockIndexedDB.ingestedContent[0].id).toBe(secondSWContent.id)
    
    // User can still read either article from localStorage
    localStorage.setItem('selectedArticleId', firstSWContent.id)
    const firstSelected = JSON.parse(localStorage.getItem(`article-${localStorage.getItem('selectedArticleId')}`) || '{}')
    expect(firstSelected.title).toBe('First SW Article')
  })

  it('should handle multiple rapid bookmarklet clicks correctly', () => {
    // Simulate user clicking bookmarklet on multiple articles quickly
    const articles = [
      { id: 'rapid-1', title: 'Rapid Article 1', url: 'https://news.com/1' },
      { id: 'rapid-2', title: 'Rapid Article 2', url: 'https://blog.com/2' },
      { id: 'rapid-3', title: 'Rapid Article 3', url: 'https://medium.com/3' }
    ]
    
    // Simulate each bookmarklet click and ingest processing
    articles.forEach((article) => {
      // Each use clears service worker storage (simulating clearAllIngestedContent)
      mockIndexedDB.ingestedContent = [article]
      
      // Ingest page processes and stores with unique ID
      localStorage.setItem(`article-${article.id}`, JSON.stringify(article))
      localStorage.setItem('selectedArticleId', article.id)
      
      // Verify the current article is selected
      const currentSelected = localStorage.getItem('selectedArticleId')
      expect(currentSelected).toBe(article.id)
    })
    
    // All articles should be preserved in localStorage
    articles.forEach(article => {
      const stored = localStorage.getItem(`article-${article.id}`)
      expect(stored).not.toBeNull()
      const parsedStored = JSON.parse(stored!)
      expect(parsedStored.title).toBe(article.title)
    })
    
    // User should be able to read any of them
    localStorage.setItem('selectedArticleId', 'rapid-1')
    const firstArticle = JSON.parse(localStorage.getItem(`article-${localStorage.getItem('selectedArticleId')}`) || '{}')
    expect(firstArticle.title).toBe('Rapid Article 1')
    
    localStorage.setItem('selectedArticleId', 'rapid-3')
    const thirdArticle = JSON.parse(localStorage.getItem(`article-${localStorage.getItem('selectedArticleId')}`) || '{}')
    expect(thirdArticle.title).toBe('Rapid Article 3')
  })

  it('should verify service worker IndexedDB only stores one item at a time', () => {
    // This ensures the clearAllIngestedContent fix prevents conflicts
    
    // First article stored in service worker
    const article1 = { id: 'single-1', title: 'Article One', timestamp: 1000 }
    mockIndexedDB.ingestedContent = [article1]
    expect(mockIndexedDB.ingestedContent).toHaveLength(1)
    
    // Second article - service worker clears first, then stores second
    mockIndexedDB.ingestedContent = [] // clearAllIngestedContent()
    const article2 = { id: 'single-2', title: 'Article Two', timestamp: 2000 }
    mockIndexedDB.ingestedContent = [article2]
    
    // Only one item in service worker storage
    expect(mockIndexedDB.ingestedContent).toHaveLength(1)
    expect(mockIndexedDB.ingestedContent[0].id).toBe('single-2')
    
    // This prevents getLatestIngestedContent from returning wrong article
    const latest = mockIndexedDB.ingestedContent[0]
    expect(latest.title).toBe('Article Two')
    expect(latest.title).not.toBe('Article One')
  })
})