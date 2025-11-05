import type { Article } from './types/content.js'
import { RSVPDisplayComponent } from './components/rsvp-display.js'
import { ReadingControlsComponent } from './components/reading-controls.js'
import { ProgressBarComponent } from './components/progress-bar.js'
import { ReadingService } from './services/reading.service.js'
import type { RSVPSettings } from './types/reading.js'

class ReadingApp {
  private article: Article | null = null
  private rsvpDisplay: RSVPDisplayComponent
  private readingControls: ReadingControlsComponent
  private progressBar: ProgressBarComponent
  private readingService: ReadingService
  
  private articleTitleElement: HTMLElement
  private totalWordsCount: number = 0

  constructor() {
    this.articleTitleElement = document.getElementById('article-title')!
    this.readingService = new ReadingService()
    
    // Initialize components
    this.rsvpDisplay = new RSVPDisplayComponent(
      document.getElementById('rsvp-display')!
    )
    
    // Default settings
    const defaultSettings: RSVPSettings = {
      speed: 250,
      pauseAtSentences: true,
      pauseAtParagraphs: true,
      skipFunctionWords: false,
      highlightKeyTerms: false,
      orpEnabled: false,
      sessionTimeLimit: 20
    }
    
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1'
    document.body.classList.toggle('debug', isDebug)
    document.body.classList.toggle('minimal', !isDebug)

    this.readingControls = new ReadingControlsComponent(
      document.getElementById('reading-controls')!,
      defaultSettings,
      !isDebug // minimal by default, full controls in debug
    )
    
    this.progressBar = new ProgressBarComponent(
      document.getElementById('progress-display')!
    )
    
    this.setupEventHandlers()
    this.loadArticle()
  }

  private setupEventHandlers(): void {
    // Reading controls handlers
    this.readingControls.setPlayHandler(() => {
      this.play()
    })

    this.readingControls.setPauseHandler(() => {
      this.pause()
    })

    this.readingControls.setSpeedChangeHandler((speed: number) => {
      this.readingService.updateSettings({ speed })
    })

    this.readingControls.setReplaySentenceHandler(() => {
      this.readingService.replaySentence()
    })

    this.readingControls.setJumpToStartHandler(() => {
      this.readingService.jumpToStart()
    })

    this.readingControls.setJumpToEndHandler(() => {
      this.readingService.jumpToEnd()
    })

    // Settings change handler
    document.getElementById('reading-controls')!.addEventListener('settingsChange', ((e: CustomEvent) => {
      const settings = e.detail.settings as RSVPSettings
      this.readingService.updateSettings(settings)
    }) as EventListener)

    // Toggle progress details when clicking on the current word area
    const rsvp = document.getElementById('rsvp-display')!
    rsvp.addEventListener('click', () => {
      this.progressBar.toggleExpanded()
    })

    // Reading service handlers
    this.readingService.setWordUpdateHandler((word, progress) => {
      const settings = this.readingControls.getSettings()
      this.rsvpDisplay.displayWord(word, settings.orpEnabled, settings.highlightKeyTerms)
      this.progressBar.updateProgress(progress, settings.speed, settings.sessionTimeLimit)
      // Track total words for seeking math
      this.totalWordsCount = progress.totalWords
    })

    this.readingService.setSessionEndHandler(() => {
      this.onSessionEnd()
    })

    // Progress bar seeking
    this.progressBar.setSeekHandler((percent) => {
      // Convert percent -> word index
      const total = Math.max(1, this.totalWordsCount)
      const index = Math.min(total - 1, Math.max(0, Math.round((percent / 100) * (total - 1))))
      this.readingService.jumpToWord(index)
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case ' ': // Space bar
          e.preventDefault()
          this.togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          this.readingService.replaySentence()
          break
        case 'ArrowRight':
          e.preventDefault()
          // Skip to next sentence (could be implemented)
          break
        case 'Home':
          e.preventDefault()
          this.readingService.jumpToStart()
          break
        case 'End':
          e.preventDefault()
          this.readingService.jumpToEnd()
          break
        case 'Escape':
          e.preventDefault()
          this.pause()
          break
      }
    })

    // Window resize handler for responsive display
    window.addEventListener('resize', () => {
      this.rsvpDisplay.updateDisplaySize()
    })
  }

  private loadArticle(): void {
    const storedArticle = localStorage.getItem('currentArticle')
    
    if (!storedArticle) {
      this.showError('No article found. Please go back and select an article.')
      return
    }

    try {
      this.article = JSON.parse(storedArticle)
      this.initializeReading()
    } catch (error) {
      this.showError('Failed to load article data.')
    }
  }

  private initializeReading(): void {
    if (!this.article) return

    // Update header
    this.articleTitleElement.textContent = this.article.title

    // Process article text for RSVP
    const words = this.readingService.processText(this.article.cleanedContent, this.article.url)
    
    if (words.length === 0) {
      this.showError('No readable content found in this article.')
      return
    }
    this.totalWordsCount = words.length

    // Start reading session
    try {
      this.readingService.startSession(this.article.id)
      
      // Show ready state
      this.rsvpDisplay.showWaiting('Ready to read')
      this.progressBar.setSessionStatus('ready')
      this.progressBar.updateProgress({
        wordsRead: 0,
        totalWords: words.length,
        percentComplete: 0,
        timeElapsed: 0,
        timeRemaining: this.estimateReadingTime(words.length),
        currentParagraph: 1,
        totalParagraphs: 1
      }, this.readingControls.getSettings().speed, this.readingControls.getSettings().sessionTimeLimit)

      // Update display size for current screen
      this.rsvpDisplay.updateDisplaySize()
      // Minimal UX: auto-start reading
      this.play()
      
    } catch (error) {
      this.showError(`Failed to initialize reading: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private estimateReadingTime(wordCount: number): number {
    const settings = this.readingControls.getSettings()
    return (wordCount / settings.speed) * 60 * 1000 // milliseconds
  }

  private play(): void {
    try {
      this.readingService.play()
      this.readingControls.setPlayState(true)
      this.progressBar.setSessionStatus('playing')
    } catch (error) {
      this.showError(`Failed to start reading: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private pause(): void {
    this.readingService.pause()
    this.readingControls.setPlayState(false)
    this.progressBar.setSessionStatus('paused')
    // Keep the current word/image visible instead of showing "Paused" text
    // this.rsvpDisplay.showPause('Paused')
  }

  private togglePlayPause(): void {
    const session = this.readingService['session'] // Access private property for state check
    if (session?.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  private onSessionEnd(): void {
    this.readingControls.setPlayState(false)
    this.progressBar.setSessionStatus('completed')
    this.rsvpDisplay.showComplete()
    this.progressBar.showCompletion()
  }

  private showError(message: string): void {
    this.rsvpDisplay.showError(message)
    this.progressBar.setSessionStatus('error')
    
    // Show fallback error in main container if RSVP display fails
    const rsvpSection = document.getElementById('rsvp-section')!
    if (!rsvpSection.querySelector('.error-indicator')) {
      rsvpSection.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: #dc2626;">
          <h2>Error</h2>
          <p>${message}</p>
          <button onclick="window.location.href='index.html'" 
                  style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Go Back to Main Page
          </button>
        </div>
      `
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReadingApp()
  ;(window as any).lucide?.createIcons?.()
})
