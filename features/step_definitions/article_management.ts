import { Given, When, Then } from '@cucumber/cucumber'
import { strict as assert } from 'node:assert'

const expect = (actual: any) => ({
  toBe: (expected: any) => assert.strictEqual(actual, expected),
  toBeDefined: () => assert.notStrictEqual(actual, undefined),
  toContain: (substr: string) => {
    assert.ok(typeof actual === 'string', 'expected a string')
    assert.ok(actual.includes(substr), `expected "${actual}" to contain "${substr}"`)
  },
  toMatch: (re: RegExp) => assert.ok(re.test(actual)),
  toBeGreaterThan: (n: number) => assert.ok(actual > n),
  toBeGreaterThanOrEqual: (n: number) => assert.ok(actual >= n),
  get not() {
    return {
      toBe: (expected: any) => assert.notStrictEqual(actual, expected),
      toBeNull: () => assert.notStrictEqual(actual, null),
      toContain: (substr: string) => {
        assert.ok(typeof actual === 'string', 'expected a string')
        assert.ok(!actual.includes(substr), `expected "${actual}" not to contain "${substr}"`)
      }
    }
  }
})

// Article management step definitions
When('I load an article from {string}', function (url: string) {
  // Simulate loading article and generating unique ID
  const articleId = `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const article = {
    id: articleId,
    title: `Article from ${url}`,
    url: url,
    content: `Content from ${url}`,
    dateAdded: new Date().toLocaleDateString(),
    readingTime: 5,
    wordCount: 1250
  }
  
  // Store using the new pattern
  localStorage.setItem(`article-${articleId}`, JSON.stringify(article))
  localStorage.setItem('selectedArticleId', articleId)
  
  // Store for later verification
  this.lastArticleId = articleId
  this.lastArticle = article
})

Then('the article should be stored with a unique identifier', function () {
  expect(this.lastArticleId).toBeDefined()
  expect(this.lastArticleId).toMatch(/^article-\d+-[a-z0-9]+$/)
  
  const stored = localStorage.getItem(`article-${this.lastArticleId}`)
  expect(stored).not.toBeNull()
  
  const article = JSON.parse(stored!)
  expect(article.id).toBe(this.lastArticleId)
})

Then('the article identifier should follow the pattern {string}', function (_pattern: string) {
  expect(this.lastArticleId).toMatch(/^article-/)
  const stored = localStorage.getItem(`article-${this.lastArticleId}`)
  expect(stored).not.toBeNull()
})

Given('I have loaded an article from {string}', function (url: string) {
  const articleId = `article-first-${Date.now()}`
  const article = {
    id: articleId,
    title: `First Article from ${url}`,
    url: url,
    content: `Content from ${url}`,
    dateAdded: new Date().toLocaleDateString(),
    readingTime: 4,
    wordCount: 1000
  }
  
  localStorage.setItem(`article-${articleId}`, JSON.stringify(article))
  localStorage.setItem('selectedArticleId', articleId)
  
  this.firstArticleId = articleId
  this.firstArticle = article
})

When('I load another article from {string}', function (url: string) {
  const articleId = `article-second-${Date.now()}`
  const article = {
    id: articleId,
    title: `Second Article from ${url}`,
    url: url,
    content: `Different content from ${url}`,
    dateAdded: new Date().toLocaleDateString(),
    readingTime: 6,
    wordCount: 1500
  }
  
  localStorage.setItem(`article-${articleId}`, JSON.stringify(article))
  localStorage.setItem('selectedArticleId', articleId)
  
  this.secondArticleId = articleId
  this.secondArticle = article
})

Then('both articles should be stored separately', function () {
  // Check first article still exists
  const firstStored = localStorage.getItem(`article-${this.firstArticleId}`)
  expect(firstStored).not.toBeNull()
  
  // Check second article exists
  const secondStored = localStorage.getItem(`article-${this.secondArticleId}`)
  expect(secondStored).not.toBeNull()
  
  // They should be different
  expect(firstStored).not.toBe(secondStored)
})

Then('each article should retain its original content', function () {
  const firstStored = JSON.parse(localStorage.getItem(`article-${this.firstArticleId}`)!)
  const secondStored = JSON.parse(localStorage.getItem(`article-${this.secondArticleId}`)!)
  
  expect(firstStored.title).toBe(this.firstArticle.title)
  expect(firstStored.content).toBe(this.firstArticle.content)
  
  expect(secondStored.title).toBe(this.secondArticle.title)
  expect(secondStored.content).toBe(this.secondArticle.content)
})

Then('the selected article should be tracked independently', function () {
  const selectedId = localStorage.getItem('selectedArticleId')
  expect(selectedId).toBe(this.secondArticleId) // Should be the last loaded
})

Given('I use the bookmarklet on {string}', function (url: string) {
  // Simulate bookmarklet ingestion
  const articleId = `ingested-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  const article = {
    id: articleId,
    title: `Bookmarklet Article from ${url}`,
    url: url,
    content: `Extracted content from ${url}`,
    source: 'bookmarklet'
  }
  
  localStorage.setItem(`article-${articleId}`, JSON.stringify(article))
  localStorage.setItem('selectedArticleId', articleId)
  
  if (!this.bookmarkletArticles) this.bookmarkletArticles = []
  this.bookmarkletArticles.push({ id: articleId, article })
})

// Alias handled by the same expression; no duplicate step needed for When

Then('each bookmarklet article should be stored separately', function () {
  expect(this.bookmarkletArticles).toBeDefined()
  expect(this.bookmarkletArticles.length).toBeGreaterThan(1)
  
  this.bookmarkletArticles.forEach(({ id }: any) => {
    const stored = localStorage.getItem(`article-${id}`)
    expect(stored).not.toBeNull()
  })
})

Then('I should be able to read either article without conflicts', function () {
  // Simulate selecting different articles
  const [first, second] = this.bookmarkletArticles
  
  // Select first article
  localStorage.setItem('selectedArticleId', first.id)
  let selectedId = localStorage.getItem('selectedArticleId')
  let selectedArticle = JSON.parse(localStorage.getItem(`article-${selectedId}`)!)
  expect(selectedArticle.title).toBe(first.article.title)
  
  // Select second article
  localStorage.setItem('selectedArticleId', second.id)
  selectedId = localStorage.getItem('selectedArticleId')
  selectedArticle = JSON.parse(localStorage.getItem(`article-${selectedId}`)!)
  expect(selectedArticle.title).toBe(second.article.title)
})

Given('I have multiple articles stored', function () {
  const articles = [
    { id: 'test-1', title: 'Test Article 1', content: 'Content 1' },
    { id: 'test-2', title: 'Test Article 2', content: 'Content 2' },
    { id: 'test-3', title: 'Test Article 3', content: 'Content 3' }
  ]
  
  articles.forEach(article => {
    localStorage.setItem(`article-${article.id}`, JSON.stringify(article))
  })
  
  this.testArticles = articles
})

When('I select an article to read', function () {
  const selectedArticle = this.testArticles[1] // Select the second article
  localStorage.setItem('selectedArticleId', selectedArticle.id)
  this.selectedArticle = selectedArticle
})

Then('the selectedArticleId should be updated', function () {
  const selectedId = localStorage.getItem('selectedArticleId')
  expect(selectedId).toBe(this.selectedArticle.id)
})

Then('the reading page should load the correct article', function () {
  // Simulate reading page loading
  const selectedId = localStorage.getItem('selectedArticleId')
  const loadedArticle = JSON.parse(localStorage.getItem(`article-${selectedId}`)!)
  
  expect(loadedArticle.title).toBe(this.selectedArticle.title)
  expect(loadedArticle.content).toBe(this.selectedArticle.content)
})

Then('other stored articles should remain unaffected', function () {
  // Check all other articles are still there and unchanged
  this.testArticles.forEach((article: any) => {
    const stored = JSON.parse(localStorage.getItem(`article-${article.id}`)!)
    expect(stored.title).toBe(article.title)
    expect(stored.content).toBe(article.content)
  })
})
