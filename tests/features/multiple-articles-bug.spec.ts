import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Multiple Articles Bug', () => {
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
  })

  it('should demonstrate the bug where second article overwrites the first in localStorage', () => {
    // Mock the main app structure
    document.body.innerHTML = `
      <div id="url-input-section"></div>
      <div id="content-section"></div>
      <button id="play-button" disabled>▷</button>
    `

    // Create mock articles
    const firstArticle = {
      id: 'article-1',
      title: 'First Article: AI Revolution',
      author: 'Author One',
      source: 'EXAMPLE.COM',
      url: 'https://example.com/article1',
      dateAdded: '1 Sep 2025',
      readingTime: 5,
      wordCount: 1250,
      content: '<p>This is the first article content.</p>',
      cleanedContent: '<p>This is the first article content.</p>'
    }

    const secondArticle = {
      id: 'article-2', 
      title: 'Second Article: Climate Change',
      author: 'Author Two',
      source: 'NEWS.COM',
      url: 'https://news.com/article2',
      dateAdded: '2 Sep 2025',
      readingTime: 7,
      wordCount: 1750,
      content: '<p>This is the second article content.</p>',
      cleanedContent: '<p>This is the second article content.</p>'
    }

    // Simulate loading first article - this is what MainApp.loadContent() does
    localStorage.setItem('currentArticle', JSON.stringify(firstArticle))
    
    // Verify first article is stored
    const storedFirst = JSON.parse(localStorage.getItem('currentArticle') || '{}')
    expect(storedFirst.title).toBe('First Article: AI Revolution')
    expect(storedFirst.id).toBe('article-1')

    // Simulate loading second article - this overwrites the first
    localStorage.setItem('currentArticle', JSON.stringify(secondArticle))
    
    // Now check what's actually stored - this demonstrates the bug
    const storedAfterSecond = JSON.parse(localStorage.getItem('currentArticle') || '{}')
    
    // THE BUG: The second article has completely overwritten the first
    expect(storedAfterSecond.title).toBe('Second Article: Climate Change')
    expect(storedAfterSecond.id).toBe('article-2')
    
    // The first article is completely lost
    expect(storedAfterSecond.title).not.toBe('First Article: AI Revolution')
    expect(storedAfterSecond.id).not.toBe('article-1')
    
    // This means when the user navigates to reading.html, 
    // they will ALWAYS see the last loaded article (the second one)
    // regardless of which article they clicked on to navigate
  })

  it('should demonstrate that reading page always loads the last stored article', () => {
    // Mock reading page structure
    document.body.innerHTML = `
      <div id="article-title"></div>
      <div id="rsvp-display"></div>
      <div id="reading-controls"></div>
      <div id="progress-display"></div>
    `

    // Simulate the scenario where user loaded multiple articles
    const firstArticle = {
      id: 'article-1',
      title: 'First Article: AI Revolution',
      cleanedContent: 'First article content'
    }

    const secondArticle = {
      id: 'article-2',
      title: 'Second Article: Climate Change', 
      cleanedContent: 'Second article content'
    }

    // User loads first article
    localStorage.setItem('currentArticle', JSON.stringify(firstArticle))
    
    // User loads second article (overwrites first)
    localStorage.setItem('currentArticle', JSON.stringify(secondArticle))
    
    // Now user clicks to read any article - ReadingApp.loadArticle() is called
    const storedArticle = localStorage.getItem('currentArticle')
    expect(storedArticle).not.toBeNull()
    
    const loadedArticle = JSON.parse(storedArticle!)
    
    // THE BUG: Regardless of which article the user intended to read,
    // they will always get the second article because it was loaded last
    expect(loadedArticle.title).toBe('Second Article: Climate Change')
    expect(loadedArticle.id).toBe('article-2')
    
    // Even if the user intended to read the first article, they can't
    expect(loadedArticle.title).not.toBe('First Article: AI Revolution')
  })

  it('should show the correct solution would be to use article-specific storage', () => {
    // This test shows what the solution should look like
    const firstArticle = {
      id: 'article-1',
      title: 'First Article: AI Revolution',
      cleanedContent: 'First article content'
    }

    const secondArticle = {
      id: 'article-2', 
      title: 'Second Article: Climate Change',
      cleanedContent: 'Second article content'
    }

    // SOLUTION: Store articles with unique keys
    localStorage.setItem(`article-${firstArticle.id}`, JSON.stringify(firstArticle))
    localStorage.setItem(`article-${secondArticle.id}`, JSON.stringify(secondArticle))
    
    // And track which article the user wants to read
    localStorage.setItem('selectedArticleId', 'article-1')
    
    // Now we can retrieve the correct article
    const selectedId = localStorage.getItem('selectedArticleId')
    const selectedArticle = JSON.parse(localStorage.getItem(`article-${selectedId}`) || '{}')
    
    expect(selectedArticle.title).toBe('First Article: AI Revolution')
    
    // Change selection to second article
    localStorage.setItem('selectedArticleId', 'article-2')
    const newSelectedId = localStorage.getItem('selectedArticleId')
    const newSelectedArticle = JSON.parse(localStorage.getItem(`article-${newSelectedId}`) || '{}')
    
    expect(newSelectedArticle.title).toBe('Second Article: Climate Change')
    
    // Both articles are still available
    const firstStillThere = JSON.parse(localStorage.getItem('article-article-1') || '{}')
    expect(firstStillThere.title).toBe('First Article: AI Revolution')
  })
})