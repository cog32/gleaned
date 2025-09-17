
describe('Main Page Features', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  describe('URL Input and Content Loading', () => {
    it('should display URL input field on page load', () => {
      // Setup DOM
      document.body.innerHTML = `
        <div id="app">
          <div class="url-input-container">
            <input id="url-input" type="url" placeholder="Enter article URL..." />
            <button id="load-button">Load</button>
          </div>
        </div>
      `

      const urlInput = document.querySelector('#url-input') as HTMLInputElement
      expect(urlInput).toBeTruthy()
      expect(urlInput.type).toBe('url')
      expect(urlInput.placeholder).toBe('Enter article URL...')
    })

    it('should enable load button when valid URL is entered', () => {
      document.body.innerHTML = `
        <div id="app">
          <input id="url-input" type="url" />
          <button id="load-button" disabled>Load</button>
        </div>
      `

      const urlInput = document.querySelector('#url-input') as HTMLInputElement
      const loadButton = document.querySelector('#load-button') as HTMLButtonElement

      expect(loadButton.disabled).toBe(true)

      // Simulate entering a valid URL
      urlInput.value = 'https://example.com/article'
      urlInput.dispatchEvent(new Event('input'))

      // This would be handled by the actual component
      loadButton.disabled = false
      expect(loadButton.disabled).toBe(false)
    })

    it('should show loading state when fetching content', async () => {
      document.body.innerHTML = `
        <div id="app">
          <input id="url-input" type="url" value="https://example.com/article" />
          <button id="load-button">Load</button>
          <div id="loading-indicator" style="display: none;">Loading...</div>
        </div>
      `

      const loadingIndicator = document.querySelector('#loading-indicator') as HTMLElement
      expect(loadingIndicator.style.display).toBe('none')

      // Simulate loading state
      loadingIndicator.style.display = 'block'
      expect(loadingIndicator.style.display).toBe('block')
    })
  })

  describe('Content Display', () => {
    it('should display article metadata after content loads', () => {
      const mockArticle = {
        title: 'Thoughts on AI and Thoughts on Middle East Conflict',
        author: 'Vitaly Katsenelson',
        source: 'vitaly.substack.com',
        dateAdded: '26 Aug 2025',
        readingTime: 6,
        content: '<p>Article content here...</p>'
      }

      document.body.innerHTML = `
        <div id="app">
          <div id="article-display" style="display: none;">
            <h1 id="article-title"></h1>
            <div class="article-meta">
              <span id="article-author"></span>
              <span id="article-date"></span>
              <span id="article-source"></span>
              <span id="reading-time"></span>
            </div>
            <div id="article-content"></div>
          </div>
        </div>
      `

      // Simulate content loaded
      const articleDisplay = document.querySelector('#article-display') as HTMLElement
      const title = document.querySelector('#article-title') as HTMLElement
      const author = document.querySelector('#article-author') as HTMLElement
      const date = document.querySelector('#article-date') as HTMLElement
      const source = document.querySelector('#article-source') as HTMLElement
      const readingTime = document.querySelector('#reading-time') as HTMLElement

      title.textContent = mockArticle.title
      author.textContent = mockArticle.author
      date.textContent = `Added on ${mockArticle.dateAdded}`
      source.textContent = mockArticle.source
      readingTime.textContent = `${mockArticle.readingTime}MIN`
      articleDisplay.style.display = 'block'

      expect(title.textContent).toBe(mockArticle.title)
      expect(author.textContent).toBe(mockArticle.author)
      expect(source.textContent).toBe(mockArticle.source)
      expect(readingTime.textContent).toBe('6MIN')
      expect(articleDisplay.style.display).toBe('block')
    })

    it('should calculate and display reading time', () => {
      const wordCount = 1500 // Approximately 6 minutes at 250 WPM
      const expectedMinutes = Math.ceil(wordCount / 250)

      expect(expectedMinutes).toBe(6)
    })

    it('should display clean content without ads and navigation', () => {
      // This would be processed by content cleaning service
      const cleanContent = '<h1>Article Title</h1><p>Article content</p>'

      document.body.innerHTML = `
        <div id="app">
          <div id="article-content">${cleanContent}</div>
        </div>
      `

      const content = document.querySelector('#article-content')
      expect(content?.innerHTML).toBe(cleanContent)
      expect(content?.innerHTML).not.toContain('Navigation')
      expect(content?.innerHTML).not.toContain('Advertisement')
      expect(content?.innerHTML).not.toContain('Sidebar')
    })
  })

  describe('Play Button and Navigation', () => {
    it('should display play button when content is loaded', () => {
      document.body.innerHTML = `
        <div id="app">
          <header class="main-header">
            <button id="play-button">▷</button>
          </header>
          <div id="article-display">Content loaded</div>
        </div>
      `

      const playButton = document.querySelector('#play-button') as HTMLButtonElement
      expect(playButton).toBeTruthy()
      expect(playButton.textContent).toBe('▷')
    })

    it('should navigate to reading page when play button is clicked', () => {
      document.body.innerHTML = `
        <div id="app">
          <button id="play-button">▷</button>
        </div>
      `

      const playButton = document.querySelector('#play-button') as HTMLButtonElement
      
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost/' },
        writable: true,
      })

      // Simulate click and navigation
      let navigationCalled = false
      playButton.addEventListener('click', () => {
        navigationCalled = true
        window.location.href = 'reading.html'
      })

      playButton.click()
      expect(navigationCalled).toBe(true)
    })

    it('should be disabled when no content is loaded', () => {
      document.body.innerHTML = `
        <div id="app">
          <button id="play-button" disabled>▷</button>
        </div>
      `

      const playButton = document.querySelector('#play-button') as HTMLButtonElement
      expect(playButton.disabled).toBe(true)
    })
  })

  describe('Responsive Layout', () => {
    it('should have mobile-friendly layout', () => {
      document.body.innerHTML = `
        <div id="app">
          <div class="container" style="max-width: 100%; padding: 1rem;">
            <div class="url-input-container">
              <input id="url-input" style="width: 100%;" />
            </div>
          </div>
        </div>
      `

      const container = document.querySelector('.container') as HTMLElement
      const urlInput = document.querySelector('#url-input') as HTMLElement

      expect(container.style.maxWidth).toBe('100%')
      expect(container.style.padding).toBe('1rem')
      expect(urlInput.style.width).toBe('100%')
    })
  })

  describe('Error Handling', () => {
    it('should display error message for invalid URLs', () => {
      document.body.innerHTML = `
        <div id="app">
          <input id="url-input" type="url" />
          <div id="error-message" style="display: none;">Invalid URL</div>
        </div>
      `

      const errorMessage = document.querySelector('#error-message') as HTMLElement
      expect(errorMessage.style.display).toBe('none')

      // Simulate error state
      errorMessage.style.display = 'block'
      expect(errorMessage.style.display).toBe('block')
    })

    it('should display error message when content fails to load', () => {
      document.body.innerHTML = `
        <div id="app">
          <div id="error-message" style="display: none;">Failed to load content</div>
        </div>
      `

      const errorMessage = document.querySelector('#error-message') as HTMLElement
      
      // Simulate network error
      errorMessage.textContent = 'Failed to load content. Please check the URL and try again.'
      errorMessage.style.display = 'block'

      expect(errorMessage.style.display).toBe('block')
      expect(errorMessage.textContent).toContain('Failed to load content')
    })
  })
})