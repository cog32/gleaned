import type { RSVPWord } from '../types/reading.js'

export class RSVPDisplayComponent {
  private container: HTMLElement
  private currentWord: RSVPWord | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.render()
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="rsvp-display">
        <div class="rsvp-focus-area">
          <div id="current-word" class="current-word">
            <span class="word-prefix"></span><span class="orp"></span><span class="word-suffix"></span>
          </div>
        </div>
        
        <!-- Context Display (optional) -->
        <div class="context-display" style="display: none;">
          <div class="prev-words">
            <span class="context-word"></span>
            <span class="context-word"></span>
            <span class="context-word"></span>
          </div>
          <div class="next-words">
            <span class="context-word"></span>
            <span class="context-word"></span>
            <span class="context-word"></span>
          </div>
        </div>

        <!-- Word Info Display -->
        <div class="word-info">
          <div class="word-stats">
            <span id="word-length" class="word-stat">0 chars</span>
            <span id="word-type" class="word-stat"></span>
          </div>
        </div>
      </div>
    `
  }

  displayWord(word: RSVPWord, showORP: boolean = true, highlightKeyTerms: boolean = showORP): void {
    this.currentWord = word
    const currentWordEl = this.container.querySelector('#current-word') as HTMLElement | null
    if (!currentWordEl) return

    // Ensure the expected span structure exists (in case a prior state replaced innerHTML)
    if (!currentWordEl.querySelector('.word-prefix') || !currentWordEl.querySelector('.orp') || !currentWordEl.querySelector('.word-suffix')) {
      currentWordEl.innerHTML = '<span class="word-prefix"></span><span class="orp"></span><span class="word-suffix"></span>'
    }

    // Special handling for image pauses
    if (word.isImage) {
      const alt = word.imageAlt && word.imageAlt.trim().length > 0 ? word.imageAlt : 'Image'
      if (word.imageSrc) {
        currentWordEl.innerHTML = `<img class="image-word" src="${word.imageSrc}" alt="${alt}">`
      } else {
        currentWordEl.innerHTML = `<span class="image-indicator">🖼 ${alt}</span>`
      }
      currentWordEl.className = 'current-word image'
      this.updateWordInfo(word)
      return
    }
    
    if (showORP && word.prefix && word.orp && word.suffix !== undefined) {
      // Display word with ORP highlighting
      const prefixEl = currentWordEl.querySelector('.word-prefix') as HTMLElement | null
      const orpEl = currentWordEl.querySelector('.orp') as HTMLElement | null
      const suffixEl = currentWordEl.querySelector('.word-suffix') as HTMLElement | null
      
      if (prefixEl) prefixEl.textContent = word.prefix
      if (orpEl) orpEl.textContent = word.orp
      if (suffixEl) suffixEl.textContent = word.suffix
      
      // Style based on word characteristics
      currentWordEl.className = 'current-word'
      // Only apply visual classes when ORP mode is on
      if (highlightKeyTerms && word.isKeyTerm) {
        currentWordEl.classList.add('key-term')
      }
      if (showORP && word.isFunctionWord) {
        currentWordEl.classList.add('function-word')
      }
      if (showORP && word.isPunctuation) {
        currentWordEl.classList.add('punctuation')
      }
    } else {
      // Display word without ORP (simple mode)
      currentWordEl.innerHTML = `<span class="simple-word">${word.text}</span>`
      
      currentWordEl.className = 'current-word simple-mode'
      // In simple mode keep a neutral style by default
    }

    this.updateWordInfo(word)
    this.animateWordEntry()
  }

  private updateWordInfo(word: RSVPWord): void {
    const wordLength = this.container.querySelector('#word-length') as HTMLElement | null
    const wordType = this.container.querySelector('#word-type') as HTMLElement | null
    
    const cleanText = word.text.replace(/[.,!?;:'"()-]/g, '')
    if (word.isImage) {
      if (wordLength) wordLength.textContent = '—'
    } else {
      if (wordLength) wordLength.textContent = `${cleanText.length} chars`
    }
    
    let typeText = ''
    if (word.isKeyTerm) typeText = 'Key Term'
    else if (word.isFunctionWord) typeText = 'Function'
    else if (word.isPunctuation) typeText = 'Punctuation'
    else typeText = 'Regular'
    
    if (word.isImage) typeText = 'Image'
    if (wordType) wordType.textContent = typeText
  }

  private animateWordEntry(): void {
    // MVP: avoid animations to reduce jank and gaps between words
    return
  }

  showPause(reason: string = 'Paused'): void {
    const currentWordEl = this.container.querySelector('#current-word') as HTMLElement | null
    if (!currentWordEl) return
    currentWordEl.innerHTML = `<span class="pause-indicator">${reason}</span>`
    currentWordEl.className = 'current-word paused'
  }

  showComplete(): void {
    const currentWordEl = this.container.querySelector('#current-word') as HTMLElement | null
    if (!currentWordEl) return
    currentWordEl.innerHTML = `<span class="completion-indicator">✓ Complete</span>`
    currentWordEl.className = 'current-word completed'
    
    // Add completion effect
    setTimeout(() => {
      currentWordEl.classList.add('completion-effect')
    }, 100)
  }

  showError(message: string): void {
    const currentWordEl = this.container.querySelector('#current-word') as HTMLElement | null
    if (!currentWordEl) return
    currentWordEl.innerHTML = `<span class="error-indicator">⚠️ ${message}</span>`
    currentWordEl.className = 'current-word error'
  }

  showWaiting(message: string = 'Ready to read'): void {
    const currentWordEl = this.container.querySelector('#current-word') as HTMLElement
    currentWordEl.innerHTML = `<span class="waiting-indicator">${message}</span>`
    currentWordEl.className = 'current-word waiting'
  }

  enableContextDisplay(prevWords: string[], nextWords: string[]): void {
    const contextDisplay = this.container.querySelector('.context-display') as HTMLElement | null
    if (!contextDisplay) return
    const prevWordsEl = contextDisplay.querySelector('.prev-words') as HTMLElement | null
    const nextWordsEl = contextDisplay.querySelector('.next-words') as HTMLElement | null
    
    // Update previous words
    const prevSpans = prevWordsEl ? prevWordsEl.querySelectorAll('.context-word') : [] as any
    prevWords.slice(-3).forEach((word, index) => {
      if (prevSpans[index]) {
        prevSpans[index].textContent = word
      }
    })
    
    // Update next words
    const nextSpans = nextWordsEl ? nextWordsEl.querySelectorAll('.context-word') : [] as any
    nextWords.slice(0, 3).forEach((word, index) => {
      if (nextSpans[index]) {
        nextSpans[index].textContent = word
      }
    })
    
    contextDisplay.style.display = 'block'
  }

  disableContextDisplay(): void {
    const contextDisplay2 = this.container.querySelector('.context-display') as HTMLElement | null
    if (contextDisplay2) contextDisplay2.style.display = 'none'
  }

  setFocusMode(enabled: boolean): void {
    const rsvpDisplay = this.container.querySelector('.rsvp-display') as HTMLElement | null
    if (!rsvpDisplay) return
    
    if (enabled) {
      rsvpDisplay.classList.add('focus-mode')
      // Hide word info in focus mode
      const wordInfo = this.container.querySelector('.word-info') as HTMLElement | null
      if (wordInfo) wordInfo.style.display = 'none'
    } else {
      rsvpDisplay.classList.remove('focus-mode')
      const wordInfo = this.container.querySelector('.word-info') as HTMLElement | null
      if (wordInfo) wordInfo.style.display = 'block'
    }
  }

  getCurrentWord(): RSVPWord | null {
    return this.currentWord
  }

  // Method to handle responsive sizing
  updateDisplaySize(): void {
    const rsvpDisplay = this.container.querySelector('.rsvp-display') as HTMLElement | null
    const currentWordEl = this.container.querySelector('#current-word') as HTMLElement | null
    if (!rsvpDisplay || !currentWordEl) return
    
    // Calculate optimal font size based on container width
    const containerWidth = rsvpDisplay.clientWidth
    let fontSize: number
    
    if (containerWidth < 400) {
      fontSize = 24 // Mobile
    } else if (containerWidth < 800) {
      fontSize = 32 // Tablet
    } else {
      fontSize = 42 // Desktop
    }
    
    currentWordEl.style.fontSize = `${fontSize}px`
  }

  // Method to handle different word display modes
  setDisplayMode(mode: 'orp' | 'simple' | 'context'): void {
    const rsvpDisplay = this.container.querySelector('.rsvp-display') as HTMLElement
    
    // Remove existing mode classes
    rsvpDisplay.classList.remove('mode-orp', 'mode-simple', 'mode-context')
    
    // Add new mode class
    rsvpDisplay.classList.add(`mode-${mode}`)
    
    if (mode === 'context') {
      this.enableContextDisplay([], [])
    } else {
      this.disableContextDisplay()
    }
    
    // Re-render current word if one exists
    if (this.currentWord) {
      this.displayWord(this.currentWord, mode === 'orp')
    }
  }
}
