import type { ReadingProgress } from '../types/reading.js'

export class ProgressBarComponent {
  private container: HTMLElement
  private expanded = false
  private isDragging = false
  private onSeek?: (percent: number) => void
  private lastPercent = 0

  constructor(container: HTMLElement) {
    this.container = container
    this.render()
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded
    const root = this.container.querySelector('.progress-container') as HTMLElement | null
    const details = this.container.querySelector('.progress-details') as HTMLElement | null
    const toggle = this.container.querySelector('#progress-toggle') as HTMLButtonElement | null
    if (root) root.classList.toggle('expanded', this.expanded)
    if (details) details.style.display = this.expanded ? 'block' : 'none'
    const icon = toggle?.querySelector('i') as HTMLElement | null
    if (icon) {
      icon.setAttribute('data-lucide', this.expanded ? 'chevron-up' : 'chevron-down')
      ;(window as any).lucide?.createIcons()
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="progress-container ${this.expanded ? 'expanded' : ''}">
        <div class="progress-header">
          <button id="progress-toggle" class="progress-toggle" aria-label="Toggle details">
            <i data-lucide="chevron-down"></i>
          </button>
        </div>

        <div class="progress-bar-section">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
            <div class="progress-marker" style="left: 0%"></div>
          </div>
          <div class="progress-labels">
            <span class="progress-start">Start</span>
            <span class="progress-end">End</span>
          </div>
        </div>

        <div class="progress-details" style="display: ${this.expanded ? 'block' : 'none'};">
          <div class="progress-stats">
            <div class="stat-group">
              <div class="stat-item">
                <span class="stat-label">Progress:</span>
                <span id="progress-text" class="stat-value">0 / 0 words</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Completion:</span>
                <span id="completion-percent" class="stat-value">0%</span>
              </div>
            </div>

            <div class="stat-group">
              <div class="stat-item">
                <span class="stat-label">Time Elapsed:</span>
                <span id="time-elapsed" class="stat-value">0:00</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Time Remaining:</span>
                <span id="time-remaining" class="stat-value">0:00</span>
              </div>
            </div>

            <div class="stat-group">
              <div class="stat-item">
                <span class="stat-label">Current Speed:</span>
                <span id="current-speed" class="stat-value">0 WPM</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Average Speed:</span>
                <span id="average-speed" class="stat-value">0 WPM</span>
              </div>
            </div>
          </div>

          <div class="session-info">
            <div class="session-status">
              <span id="session-status" class="status-indicator">Ready</span>
            </div>
            <div class="session-timer">
              <span class="timer-label">Session:</span>
              <span id="session-time" class="timer-value">0:00</span>
              <span id="session-limit" class="timer-limit">/ 20:00</span>
            </div>
          </div>
        </div>
      </div>
    `

    // Init icons
    ;(window as any).lucide?.createIcons()

    const toggle = this.container.querySelector('#progress-toggle') as HTMLButtonElement | null
    toggle?.addEventListener('click', () => {
      this.expanded = !this.expanded
      const root = this.container.querySelector('.progress-container') as HTMLElement | null
      const details = this.container.querySelector('.progress-details') as HTMLElement | null
      if (root) root.classList.toggle('expanded', this.expanded)
      if (details) details.style.display = this.expanded ? 'block' : 'none'
      const icon = toggle.querySelector('i') as HTMLElement | null
      if (icon) {
        icon.setAttribute('data-lucide', this.expanded ? 'chevron-up' : 'chevron-down')
        ;(window as any).lucide?.createIcons()
      }
    })

    // Seek interactions (click/drag) on progress bar
    const bar = this.container.querySelector('.progress-bar') as HTMLElement | null
    if (bar) {
      const computePercent = (clientX: number) => {
        const rect = bar.getBoundingClientRect()
        const raw = ((clientX - rect.left) / rect.width) * 100
        const clamped = Math.max(0, Math.min(100, raw))
        return clamped
      }

      const updateVisual = (percent: number) => {
        const progressFill = this.container.querySelector('.progress-fill') as HTMLElement | null
        const progressMarker = this.container.querySelector('.progress-marker') as HTMLElement | null
        if (progressFill) progressFill.style.width = `${percent}%`
        if (progressMarker) progressMarker.style.left = `${percent}%`
      }

      const onPointerDown = (clientX: number) => {
        this.isDragging = true
        this.lastPercent = computePercent(clientX)
        updateVisual(this.lastPercent)
      }

      const onPointerMove = (clientX: number) => {
        if (!this.isDragging) return
        this.lastPercent = computePercent(clientX)
        updateVisual(this.lastPercent)
      }

      const onPointerUp = () => {
        if (!this.isDragging) return
        this.isDragging = false
        // Notify listener
        this.onSeek?.(this.lastPercent)
      }

      // Mouse events
      bar.addEventListener('mousedown', (e: MouseEvent) => {
        onPointerDown(e.clientX)
        const move = (ev: MouseEvent) => onPointerMove(ev.clientX)
        const up = () => {
          window.removeEventListener('mousemove', move)
          window.removeEventListener('mouseup', up)
          onPointerUp()
        }
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', up)
      })

      // Touch events
      bar.addEventListener('touchstart', (e: TouchEvent) => {
        if (e.touches.length > 0) {
          onPointerDown(e.touches[0].clientX)
        }
      }, { passive: true })

      bar.addEventListener('touchmove', (e: TouchEvent) => {
        if (e.touches.length > 0) {
          onPointerMove(e.touches[0].clientX)
        }
      }, { passive: true })

      bar.addEventListener('touchend', () => {
        onPointerUp()
      })
    }
  }

  updateProgress(progress: ReadingProgress, currentSpeed: number, sessionTimeLimit: number): void {
    this.updateProgressBar(progress.percentComplete)
    this.updateProgressText(progress.wordsRead, progress.totalWords)
    this.updateCompletionPercent(progress.percentComplete)
    this.updateTimeInfo(progress.timeElapsed, progress.timeRemaining)
    this.updateSpeedInfo(currentSpeed, progress)
    this.updateSessionInfo(progress.timeElapsed, sessionTimeLimit)
  }

  private updateProgressBar(percentComplete: number): void {
    const progressFill = this.container.querySelector('.progress-fill') as HTMLElement | null
    const progressMarker = this.container.querySelector('.progress-marker') as HTMLElement | null
    if (!progressFill || !progressMarker) return
    
    const clampedPercent = Math.max(0, Math.min(100, percentComplete))
    progressFill.style.width = `${clampedPercent}%`
    progressMarker.style.left = `${clampedPercent}%`
    this.lastPercent = clampedPercent

    // Keep progress bar a constant color
    progressFill.className = 'progress-fill'
  }

  setSeekHandler(handler: (percent: number) => void): void {
    this.onSeek = handler
  }

  private updateProgressText(wordsRead: number, totalWords: number): void {
    const progressText = this.container.querySelector('#progress-text') as HTMLElement | null
    if (progressText) {
      progressText.textContent = `${wordsRead.toLocaleString()} / ${totalWords.toLocaleString()} words`
    }
  }

  private updateCompletionPercent(percentComplete: number): void {
    const completionPercent = this.container.querySelector('#completion-percent') as HTMLElement | null
    if (completionPercent) {
      completionPercent.textContent = `${Math.round(percentComplete)}%`
    }
  }

  private updateTimeInfo(timeElapsed: number, timeRemaining: number): void {
    const timeElapsedEl = this.container.querySelector('#time-elapsed') as HTMLElement | null
    const timeRemainingEl = this.container.querySelector('#time-remaining') as HTMLElement | null
    
    if (timeElapsedEl) timeElapsedEl.textContent = this.formatTime(timeElapsed)
    if (timeRemainingEl) timeRemainingEl.textContent = this.formatTime(timeRemaining)
  }

  private updateSpeedInfo(currentSpeed: number, progress: ReadingProgress): void {
    const currentSpeedEl = this.container.querySelector('#current-speed') as HTMLElement | null
    const averageSpeedEl = this.container.querySelector('#average-speed') as HTMLElement | null
    
    if (currentSpeedEl) currentSpeedEl.textContent = `${currentSpeed} WPM`
    
    // Calculate average speed
    const minutesElapsed = progress.timeElapsed / 60000
    const averageSpeed = minutesElapsed > 0 ? Math.round(progress.wordsRead / minutesElapsed) : 0
    if (averageSpeedEl) averageSpeedEl.textContent = `${averageSpeed} WPM`
  }

  private updateSessionInfo(sessionTime: number, sessionTimeLimit: number): void {
    const sessionTimeEl = this.container.querySelector('#session-time') as HTMLElement | null
    const sessionLimitEl = this.container.querySelector('#session-limit') as HTMLElement | null
    const sessionStatus = this.container.querySelector('#session-status') as HTMLElement | null
    
    if (sessionTimeEl) sessionTimeEl.textContent = this.formatTime(sessionTime)
    if (sessionLimitEl) sessionLimitEl.textContent = `/ ${this.formatTime(sessionTimeLimit * 60 * 1000)}`
    
    // Update session status
    const sessionProgress = sessionTime / (sessionTimeLimit * 60 * 1000)
    if (sessionStatus) {
      if (sessionProgress < 0.5) {
        sessionStatus.textContent = 'Active'
        sessionStatus.className = 'status-indicator status-active'
      } else if (sessionProgress < 0.8) {
        sessionStatus.textContent = 'Midway'
        sessionStatus.className = 'status-indicator status-midway'
      } else if (sessionProgress < 1.0) {
        sessionStatus.textContent = 'Ending Soon'
        sessionStatus.className = 'status-indicator status-warning'
      } else {
        sessionStatus.textContent = 'Time Limit'
        sessionStatus.className = 'status-indicator status-limit'
      }
    }
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  setSessionStatus(status: 'ready' | 'playing' | 'paused' | 'completed' | 'error'): void {
    const sessionStatus = this.container.querySelector('#session-status') as HTMLElement | null
    
    if (!sessionStatus) return
    switch (status) {
      case 'ready':
        sessionStatus.textContent = 'Ready'
        sessionStatus.className = 'status-indicator status-ready'
        break
      case 'playing':
        sessionStatus.textContent = 'Reading'
        sessionStatus.className = 'status-indicator status-playing'
        break
      case 'paused':
        sessionStatus.textContent = 'Paused'
        sessionStatus.className = 'status-indicator status-paused'
        break
      case 'completed':
        sessionStatus.textContent = 'Completed'
        sessionStatus.className = 'status-indicator status-completed'
        break
      case 'error':
        sessionStatus.textContent = 'Error'
        sessionStatus.className = 'status-indicator status-error'
        break
    }
  }

  showCompletion(): void {
    // Add completion animation/effects
    const progressContainer = this.container.querySelector('.progress-container') as HTMLElement | null
    if (!progressContainer) return
    progressContainer.classList.add('completed')
    
    // Show completion message
    const completionMessage = document.createElement('div')
    completionMessage.className = 'completion-message'
    completionMessage.innerHTML = `
      <div class="completion-content">
        <div class="completion-icon">🎉</div>
        <div class="completion-text">
          <h3>Reading Completed!</h3>
          <p>Great job finishing the article.</p>
        </div>
        <button class="completion-action" onclick="window.location.href='index.html'">
          Read Another Article
        </button>
      </div>
    `
    
    this.container.appendChild(completionMessage)
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (completionMessage.parentNode) {
        completionMessage.remove()
        progressContainer.classList.remove('completed')
      }
    }, 5000)
  }

  reset(): void {
    this.updateProgress({
      wordsRead: 0,
      totalWords: 0,
      percentComplete: 0,
      timeElapsed: 0,
      timeRemaining: 0,
      currentParagraph: 0,
      totalParagraphs: 0
    }, 250, 20)
    
    this.setSessionStatus('ready')
    
    // Remove completion state
    const progressContainer2 = this.container.querySelector('.progress-container') as HTMLElement | null
    if (progressContainer2) progressContainer2.classList.remove('completed')
    
    const completionMessage = this.container.querySelector('.completion-message')
    if (completionMessage) {
      completionMessage.remove()
    }
  }
}
