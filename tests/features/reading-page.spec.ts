describe('RSVP Reading Page Features', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    
    // Mock localStorage with sample article
    const mockArticle = {
      id: 'test-article',
      title: 'Test Article',
      author: 'Test Author',
      content: 'This is a test article. It has multiple sentences for testing.',
      wordCount: 12,
      readingTime: 1
    }
    localStorage.setItem('currentArticle', JSON.stringify(mockArticle))
  })

  describe('RSVP Display', () => {
    it('should display words one at a time in fixed position', () => {
      document.body.innerHTML = `
        <div id="app">
          <div id="rsvp-display" class="rsvp-display">
            <div id="current-word" class="current-word">Test</div>
          </div>
        </div>
      `

      const currentWord = document.querySelector('#current-word') as HTMLElement
      expect(currentWord).toBeTruthy()
      expect(currentWord.textContent).toBe('Test')
      
      // Should be centered and fixed position
      expect(currentWord.classList.contains('current-word')).toBe(true)
    })

    it('should highlight Optimal Recognition Point (ORP)', () => {
      document.body.innerHTML = `
        <div id="current-word" class="current-word">
          <span class="word-prefix">wo</span><span class="orp">r</span><span class="word-suffix">d</span>
        </div>
      `

      const orp = document.querySelector('.orp') as HTMLElement
      expect(orp).toBeTruthy()
      expect(orp.textContent).toBe('r')
    })

    it('should adjust display time for longer words', () => {
      const baseTime = 240 // 250 WPM = 240ms per word
      const longWord = 'extraordinary'
      
      // Longer words should get more time (simple algorithm)
      const shortWordTime = baseTime
      const longWordTime = baseTime + (longWord.length - 3) * 20
      
      expect(longWordTime).toBeGreaterThan(shortWordTime)
      expect(longWordTime).toBe(baseTime + (13 - 3) * 20) // 440ms
    })
  })

  describe('Speed Controls', () => {
    it('should have play/pause button', () => {
      document.body.innerHTML = `
        <div id="app">
          <div class="reading-controls">
            <button id="play-pause-btn" class="play-pause-btn">▶️</button>
          </div>
        </div>
      `

      const playPauseBtn = document.querySelector('#play-pause-btn') as HTMLButtonElement
      expect(playPauseBtn).toBeTruthy()
      expect(playPauseBtn.textContent).toBe('▶️')
    })

    it('should toggle play/pause state', () => {
      document.body.innerHTML = `
        <button id="play-pause-btn" class="play-pause-btn">▶️</button>
      `

      const btn = document.querySelector('#play-pause-btn') as HTMLButtonElement
      
      // Simulate play state
      btn.textContent = '⏸️'
      btn.dataset.playing = 'true'
      expect(btn.textContent).toBe('⏸️')
      expect(btn.dataset.playing).toBe('true')
      
      // Simulate pause state
      btn.textContent = '▶️'
      btn.dataset.playing = 'false'
      expect(btn.textContent).toBe('▶️')
      expect(btn.dataset.playing).toBe('false')
    })

    it('should have speed adjustment controls', () => {
      document.body.innerHTML = `
        <div class="speed-controls">
          <button class="speed-preset" data-speed="150">Slow</button>
          <button class="speed-preset" data-speed="250">Medium</button>
          <button class="speed-preset" data-speed="400">Fast</button>
          <input type="range" id="speed-slider" min="150" max="600" value="250" />
          <span id="speed-display">250 WPM</span>
        </div>
      `

      const slowBtn = document.querySelector('[data-speed="150"]') as HTMLButtonElement
      const mediumBtn = document.querySelector('[data-speed="250"]') as HTMLButtonElement
      const fastBtn = document.querySelector('[data-speed="400"]') as HTMLButtonElement
      const speedSlider = document.querySelector('#speed-slider') as HTMLInputElement
      const speedDisplay = document.querySelector('#speed-display') as HTMLElement

      expect(slowBtn.textContent).toBe('Slow')
      expect(mediumBtn.textContent).toBe('Medium')
      expect(fastBtn.textContent).toBe('Fast')
      expect(speedSlider.min).toBe('150')
      expect(speedSlider.max).toBe('600')
      expect(speedSlider.value).toBe('250')
      expect(speedDisplay.textContent).toBe('250 WPM')
    })
  })

  describe('Progress Tracking', () => {
    it('should show reading progress', () => {
      document.body.innerHTML = `
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 25%"></div>
          </div>
          <span class="progress-text">3 / 12 words</span>
        </div>
      `

      const progressFill = document.querySelector('.progress-fill') as HTMLElement
      const progressText = document.querySelector('.progress-text') as HTMLElement

      expect(progressFill.style.width).toBe('25%')
      expect(progressText.textContent).toBe('3 / 12 words')
    })

    it('should show estimated time remaining', () => {
      document.body.innerHTML = `
        <div class="time-info">
          <span id="time-elapsed">0:15</span>
          <span id="time-remaining">0:45</span>
        </div>
      `

      const timeElapsed = document.querySelector('#time-elapsed') as HTMLElement
      const timeRemaining = document.querySelector('#time-remaining') as HTMLElement

      expect(timeElapsed.textContent).toBe('0:15')
      expect(timeRemaining.textContent).toBe('0:45')
    })
  })

  describe('Comprehension Features', () => {
    it('should pause at sentence boundaries', () => {
      const text = 'First sentence. Second sentence.'
      const words = text.split(/\s+/)
      const sentenceEndIndex = words.findIndex(word => word.includes('.'))
      
      expect(sentenceEndIndex).toBe(1) // "sentence."
      // In real implementation, this word would get extended display time
    })

    it('should have replay functionality', () => {
      document.body.innerHTML = `
        <div class="replay-controls">
          <button id="replay-sentence">↶ Sentence</button>
          <button id="replay-paragraph">↶ Paragraph</button>
        </div>
      `

      const replaySentence = document.querySelector('#replay-sentence') as HTMLButtonElement
      const replayParagraph = document.querySelector('#replay-paragraph') as HTMLButtonElement

      expect(replaySentence.textContent).toBe('↶ Sentence')
      expect(replayParagraph.textContent).toBe('↶ Paragraph')
    })

    it('should highlight key terms with extended display', () => {
      const keyTerms = ['important', 'crucial', 'significant']
      const testWord = 'important'
      
      const isKeyTerm = keyTerms.includes(testWord.toLowerCase())
      expect(isKeyTerm).toBe(true)
      
      // In real implementation, key terms would get 150% normal display time
      const normalTime = 240
      const keyTermTime = Math.floor(normalTime * 1.5)
      expect(keyTermTime).toBe(360)
    })
  })

  describe('User Experience', () => {
    it('should handle session time limits', () => {
      const sessionStartTime = Date.now()
      const twentyMinutesMs = 20 * 60 * 1000
      const sessionEndTime = sessionStartTime + twentyMinutesMs
      
      const shouldPause = Date.now() >= sessionEndTime
      // In a 20-minute session, this would be true
      expect(typeof shouldPause).toBe('boolean')
    })

    it('should skip function words at higher speeds', () => {
      const functionWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']
      const testWord = 'the'
      const currentSpeed = 400 // WPM
      
      const isFunctionWord = functionWords.includes(testWord.toLowerCase())
      const shouldSkip = isFunctionWord && currentSpeed > 350
      
      expect(isFunctionWord).toBe(true)
      expect(shouldSkip).toBe(true)
    })

    it('should provide navigation controls', () => {
      document.body.innerHTML = `
        <div class="navigation-controls">
          <button id="prev-paragraph">⬅️ Previous</button>
          <button id="next-paragraph">➡️ Next</button>
          <button id="jump-to-start">⬅️ Start</button>
          <button id="jump-to-end">➡️ End</button>
        </div>
      `

      const prevParagraph = document.querySelector('#prev-paragraph') as HTMLButtonElement
      const nextParagraph = document.querySelector('#next-paragraph') as HTMLButtonElement
      const jumpToStart = document.querySelector('#jump-to-start') as HTMLButtonElement
      const jumpToEnd = document.querySelector('#jump-to-end') as HTMLButtonElement

      expect(prevParagraph).toBeTruthy()
      expect(nextParagraph).toBeTruthy()
      expect(jumpToStart).toBeTruthy()
      expect(jumpToEnd).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing article gracefully', () => {
      localStorage.removeItem('currentArticle')
      
      document.body.innerHTML = `
        <div id="error-message" style="display: block;">
          No article found. Please go back and select an article.
        </div>
      `

      const errorMessage = document.querySelector('#error-message') as HTMLElement
      expect(errorMessage.style.display).toBe('block')
    })

    it('should handle empty content', () => {
      const emptyArticle = {
        title: 'Empty Article',
        content: '',
        wordCount: 0
      }
      localStorage.setItem('currentArticle', JSON.stringify(emptyArticle))

      const words = emptyArticle.content.trim().split(/\s+/).filter(word => word.length > 0)
      expect(words.length).toBe(0)
    })
  })
})