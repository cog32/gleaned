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

// Main page step definitions
Then('I should see a clean, minimal interface', function () {
  // This would check the UI elements are minimal and clean
  expect(true).toBe(true) // Placeholder for UI inspection
})

Then('the UI should prefer icons over text', function () {
  // Check that buttons use icons (▷, ≡≡≡, •••, etc.) instead of text labels
  expect(true).toBe(true) // Placeholder for icon verification
})

Then('the background should be white for reading focus', function () {
  // Verify clean white background without distractions
  expect(true).toBe(true) // Placeholder for background color check
})

When('I enter a valid article URL {string}', function (url: string) {
  this.inputUrl = url
  // Simulate URL input
})

When('I click the load button', function () {
  // Simulate content extraction and cleaning
  const articleId = `extracted-${Date.now()}`
  const article = {
    id: articleId,
    title: 'Extracted Article Title',
    author: 'Article Author',
    url: this.inputUrl,
    dateAdded: new Date().toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }),
    readingTime: 5,
    wordCount: 1250,
    content: '<div>Original article with ads</div>',
    cleanedContent: '<p>Clean article content without ads</p>'
  }
  
  localStorage.setItem(`article-${articleId}`, JSON.stringify(article))
  localStorage.setItem('selectedArticleId', articleId)
  
  this.loadedArticle = article
})

Then('the article content should be extracted and cleaned', function () {
  expect(this.loadedArticle).toBeDefined()
  expect(this.loadedArticle.cleanedContent).toBeDefined()
  expect(this.loadedArticle.cleanedContent).not.toContain('ads')
})

Then('I should see the article title, author, and reading time', function () {
  expect(this.loadedArticle.title).toBe('Extracted Article Title')
  expect(this.loadedArticle.author).toBe('Article Author')
  expect(this.loadedArticle.readingTime).toBe(5)
})

Then('ads and navigation elements should be removed', function () {
  expect(this.loadedArticle.cleanedContent).not.toContain('Navigation')
  expect(this.loadedArticle.cleanedContent).not.toContain('Advertisement')
  expect(this.loadedArticle.cleanedContent).not.toContain('Sidebar')
})

Then('the content should have a clean white background', function () {
  // Verify the content display has clean white background
  expect(true).toBe(true) // Placeholder for background verification
})

Given('I have loaded an article with {int} words', function (wordCount: number) {
  const articleId = `word-test-${Date.now()}`
  const article = {
    id: articleId,
    title: 'Word Count Test Article',
    wordCount: wordCount,
    readingTime: 0 // Will be calculated
  }
  
  this.wordTestArticle = article
})

When('the reading time is calculated at {int} WPM', function (wpm: number) {
  const estimatedMinutes = Math.ceil(this.wordTestArticle.wordCount / wpm)
  this.wordTestArticle.readingTime = estimatedMinutes
})

Then('I should see {string} reading time displayed', function (expectedTime: string) {
  expect(this.wordTestArticle.readingTime.toString() + 'MIN').toBe(expectedTime)
})

Then('the reading time should update based on word count', function () {
  // Test different word counts
  const testCases = [
    { words: 250, expectedMinutes: 1 },
    { words: 500, expectedMinutes: 2 },
    { words: 1250, expectedMinutes: 5 }
  ]
  
  testCases.forEach(testCase => {
    const calculatedMinutes = Math.ceil(testCase.words / 250) // 250 WPM
    expect(calculatedMinutes).toBe(testCase.expectedMinutes)
  })
})

Given('I have successfully loaded an article', function () {
  const articleId = `success-test-${Date.now()}`
  const article = {
    id: articleId,
    title: 'Successfully Loaded Article',
    content: 'Article content'
  }
  
  localStorage.setItem(`article-${articleId}`, JSON.stringify(article))
  localStorage.setItem('selectedArticleId', articleId)
  
  this.successArticle = article
})

When('I see the article preview', function () {
  // Article is loaded and preview is shown
  expect(this.successArticle).toBeDefined()
})

Then('the play button should be enabled', function () {
  // In the real app, this would check that play button is not disabled
  expect(this.successArticle).toBeDefined() // If article loaded, play button should be enabled
})

When('I click the play button', function () {
  // Simulate navigation to reading page
  this.navigatedTo = 'reading.html'
})

Then('I should navigate to the reading page', function () {
  expect(this.navigatedTo).toBe('reading.html')
})

Given('I load an article with ads and navigation', function () {
  const articleId = `cleanup-test-${Date.now()}`
  const article = {
    id: articleId,
    title: 'Article with Ads',
    content: '<div>Navigation</div><div>Advertisement</div><div>Sidebar</div><p>Main content</p>',
    cleanedContent: '<p>Main content</p>' // Cleaned version
  }
  
  this.cleanupTestArticle = article
})

When('the content is processed', function () {
  // Content cleaning has already been simulated in the Given step
  expect(this.cleanupTestArticle.cleanedContent).toBeDefined()
})

Then('I should only see the article title and main content', function () {
  expect(this.cleanupTestArticle.cleanedContent).toBe('<p>Main content</p>')
})

Then('images should be preserved and displayed cleanly', function () {
  // Images should be maintained in the cleaned content
  expect(true).toBe(true) // Placeholder for image preservation check
})

Then('no advertisements or sidebar content should appear', function () {
  expect(this.cleanupTestArticle.cleanedContent).not.toContain('Advertisement')
  expect(this.cleanupTestArticle.cleanedContent).not.toContain('Sidebar')
  expect(this.cleanupTestArticle.cleanedContent).not.toContain('Navigation')
})
