import type { RSVPWord, ReadingSession, ReadingProgress, RSVPSettings } from '../types/reading.js'

export class ReadingService {
  private words: RSVPWord[] = []
  private sourceHTML: string = ''
  private sourceBaseUrl: string | undefined
  private session: ReadingSession | null = null
  private nextDue: number | null = null
  private settings: RSVPSettings = {
    speed: 250,
    pauseAtSentences: true,
    pauseAtParagraphs: true,
    skipFunctionWords: false,
    highlightKeyTerms: false,
    orpEnabled: false,
    sessionTimeLimit: 20
  }
  
  private timer: number | null = null
  private onWordUpdate?: (word: RSVPWord, progress: ReadingProgress) => void
  private onSessionEnd?: () => void

  private readonly FUNCTION_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
    'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 
    'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 
    'would', 'could', 'should', 'may', 'might', 'must', 'can'
  ])

  private readonly KEY_TERMS = new Set([
    'important', 'crucial', 'significant', 'essential', 'critical', 'key', 
    'major', 'primary', 'fundamental', 'vital', 'necessary', 'required'
  ])

  processText(contentHTML: string, baseUrl?: string): RSVPWord[] {
    this.sourceHTML = contentHTML
    this.sourceBaseUrl = baseUrl
    const container = document.createElement('div')
    container.innerHTML = contentHTML

    const words: RSVPWord[] = []

    const IMAGE_PAUSE_MS = 2500

    const pushImagePause = (src?: string, alt?: string) => {
      const imageWord: RSVPWord = {
        text: alt && alt.trim().length > 0 ? alt.trim() : '🖼 Image',
        prefix: '',
        orp: '',
        suffix: '',
        displayTime: IMAGE_PAUSE_MS,
        isKeyTerm: false,
        isPunctuation: false,
        isFunctionWord: false,
        isImage: true,
        imageSrc: src,
        imageAlt: alt
      }
      words.push(imageWord)
    }

    const processTextNode = (text: string) => {
      // Normalize whitespace in this chunk
      const normalized = text.replace(/\s+/g, ' ').trim()
      if (!normalized) return
      const raw = normalized
        .split(/\s+/)
        .filter(t => t.length > 0)
        .filter(t => /[A-Za-z]/.test(t))
      raw.forEach(token => words.push(this.processWord(token)))
    }

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node.nodeValue || '')
        return
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        // Skip non-content containers we might have missed
        const tag = el.tagName.toLowerCase()
        if (tag === 'script' || tag === 'style' || tag === 'noscript') return
        if (tag === 'img') {
          const img = el as HTMLImageElement
          // Prefer raw attribute to resolve against base URL if provided
          const raw = img.getAttribute('src') || ''
          const alt = img.getAttribute('alt') || ''
          let resolved: string | undefined
          try {
            if (raw.startsWith('data:')) {
              resolved = raw
            } else if (raw) {
              if (baseUrl) {
                resolved = new URL(raw, baseUrl).toString()
              } else {
                // Fall back to browser's resolution which may be relative to current page
                resolved = img.src || raw
              }
            }
          } catch {
            resolved = raw || undefined
          }
          pushImagePause(resolved, alt)
          return
        }
        // Recurse children in order
        for (const child of Array.from(el.childNodes)) {
          walk(child)
        }
      }
    }

    // Start walking from top-level children to preserve order
    for (const child of Array.from(container.childNodes)) {
      walk(child)
    }

    this.words = words
    return this.words
  }

  private processWord(word: string): RSVPWord {
    const cleanWord = word.replace(/[^\w\s.,!?;:'"()-]/g, '')
    const baseDisplayTime = 60000 / this.settings.speed // ms per word
    
    // Calculate ORP (Optimal Recognition Point)
    const orp = this.calculateORP(cleanWord)
    
    // Determine word characteristics
    const isKeyTerm = this.KEY_TERMS.has(cleanWord.toLowerCase().replace(/[.,!?;:'"()-]/g, ''))
    const isPunctuation = /[.!?]/.test(word)
    const isFunctionWord = this.FUNCTION_WORDS.has(cleanWord.toLowerCase().replace(/[.,!?;:'"()-]/g, ''))
    
    // Calculate display time
    let displayTime = baseDisplayTime
    
    // Longer words get more time
    if (cleanWord.length > 6) {
      displayTime += (cleanWord.length - 6) * 20
    }
    
    // Key terms get extended time
    if (isKeyTerm && this.settings.highlightKeyTerms) {
      displayTime *= 1.5
    }
    
    // Punctuation gets pause time
    if (isPunctuation) {
      if (this.settings.pauseAtSentences) {
        displayTime += 200 // 200ms pause
      }
    }
    
    // Function words can be shortened at high speeds
    if (isFunctionWord && this.settings.skipFunctionWords && this.settings.speed > 350) {
      displayTime *= 0.7
    }

    return {
      text: word,
      prefix: orp.prefix,
      orp: orp.orp,
      suffix: orp.suffix,
      displayTime: Math.max(displayTime, 100), // Minimum 100ms
      isKeyTerm,
      isPunctuation,
      isFunctionWord,
      isImage: false
    }
  }

  private calculateORP(word: string): { prefix: string; orp: string; suffix: string } {
    const cleanWord = word.replace(/[.,!?;:'"()-]/g, '')
    const length = cleanWord.length
    
    if (length === 0) {
      return { prefix: '', orp: word, suffix: '' }
    }
    
    // ORP is typically around 1/3 into the word
    let orpIndex: number
    if (length <= 2) {
      orpIndex = 0
    } else if (length <= 5) {
      orpIndex = 1
    } else {
      orpIndex = Math.floor(length * 0.35)
    }
    
    const prefix = cleanWord.substring(0, orpIndex)
    const orp = cleanWord.charAt(orpIndex)
    const suffix = cleanWord.substring(orpIndex + 1) + word.substring(cleanWord.length) // Add punctuation back
    
    return { prefix, orp, suffix }
  }

  startSession(articleId: string): ReadingSession {
    if (this.words.length === 0) {
      throw new Error('No words to read. Process text first.')
    }

    this.session = {
      articleId,
      startTime: Date.now(),
      currentWordIndex: 0,
      totalWords: this.words.length,
      speed: this.settings.speed,
      isPlaying: false,
      isPaused: false,
      sessionDuration: 0
    }

    return this.session
  }

  play(): void {
    if (!this.session) {
      throw new Error('No active session. Start session first.')
    }

    if (this.session.currentWordIndex >= this.words.length) {
      this.endSession()
      return
    }

    this.session.isPlaying = true
    this.session.isPaused = false
    // Initialize drift-corrected schedule baseline (use Date.now for test-friendly timers)
    this.nextDue = Date.now()
    this.scheduleNextWord()
  }

  pause(): void {
    if (this.session) {
      this.session.isPlaying = false
      this.session.isPaused = true
    }
    
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.nextDue = null
  }

  private scheduleNextWord(): void {
    if (!this.session || !this.session.isPlaying || this.session.currentWordIndex >= this.words.length) {
      return
    }

    // Check session time limit
    const sessionTime = Date.now() - this.session.startTime
    const timeLimit = this.settings.sessionTimeLimit * 60 * 1000
    
    if (sessionTime >= timeLimit) {
      this.pause()
      this.onSessionEnd?.()
      return
    }

    const currentWord = this.words[this.session.currentWordIndex]
    const progress = this.getProgress()

    // Notify listeners
    this.onWordUpdate?.(currentWord, progress)

    // Schedule next word (drift-corrected)
    if (this.nextDue == null) {
      this.nextDue = Date.now()
    }
    this.nextDue += currentWord.displayTime
    const delay = Math.max(0, this.nextDue - Date.now())

    this.timer = window.setTimeout(() => {
      if (this.session && this.session.isPlaying) {
        this.session.currentWordIndex++
        this.session.sessionDuration = Date.now() - this.session.startTime
        
        if (this.session.currentWordIndex >= this.words.length) {
          this.endSession()
        } else {
          this.scheduleNextWord()
        }
      }
    }, delay)
  }

  private endSession(): void {
    this.pause()
    this.onSessionEnd?.()
  }

  getProgress(): ReadingProgress {
    if (!this.session) {
      return {
        wordsRead: 0,
        totalWords: 0,
        percentComplete: 0,
        timeElapsed: 0,
        timeRemaining: 0,
        currentParagraph: 0,
        totalParagraphs: 0
      }
    }

    const wordsRead = this.session.currentWordIndex
    const totalWords = this.session.totalWords
    const percentComplete = totalWords > 0 ? (wordsRead / totalWords) * 100 : 0
    const timeElapsed = this.session.sessionDuration
    const averageWordTime = timeElapsed / Math.max(wordsRead, 1)
    const remainingWords = totalWords - wordsRead
    const timeRemaining = remainingWords * averageWordTime

    return {
      wordsRead,
      totalWords,
      percentComplete,
      timeElapsed,
      timeRemaining,
      currentParagraph: 1, // TODO: Calculate based on paragraph breaks
      totalParagraphs: 1   // TODO: Calculate based on content structure
    }
  }

  // Navigation methods
  jumpToWord(wordIndex: number): void {
    if (this.session && wordIndex >= 0 && wordIndex < this.words.length) {
      this.session.currentWordIndex = wordIndex
    }
  }

  jumpToStart(): void {
    this.jumpToWord(0)
  }

  jumpToEnd(): void {
    this.jumpToWord(this.words.length - 1)
  }

  replaySentence(): void {
    if (!this.session) return
    
    // Find start of current sentence
    let startIndex = this.session.currentWordIndex
    for (let i = startIndex - 1; i >= 0; i--) {
      if (this.words[i].isPunctuation) {
        startIndex = i + 1
        break
      }
      if (i === 0) {
        startIndex = 0
        break
      }
    }
    
    this.jumpToWord(startIndex)
  }

  // Settings
  updateSettings(newSettings: Partial<RSVPSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    
    // Reprocess words if settings that affect word processing changed
    if (newSettings.speed || newSettings.highlightKeyTerms || newSettings.skipFunctionWords) {
      if (this.sourceHTML) {
        this.processText(this.sourceHTML, this.sourceBaseUrl)
      }
    }
  }

  getSettings(): RSVPSettings {
    return { ...this.settings }
  }

  // Event handlers
  setWordUpdateHandler(handler: (word: RSVPWord, progress: ReadingProgress) => void): void {
    this.onWordUpdate = handler
  }

  setSessionEndHandler(handler: () => void): void {
    this.onSessionEnd = handler
  }
}
