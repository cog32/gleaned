import type { RSVPSettings } from '../types/reading.js'

export class ReadingControlsComponent {
  private container: HTMLElement
  private minimal = false
  private isPlaying = false
  private currentSpeed = 250
  private settings: RSVPSettings
  
  private onPlay?: () => void
  private onPause?: () => void
  private onSpeedChange?: (speed: number) => void
  private onReplaySentence?: () => void
  private onReplayParagraph?: () => void
  private onJumpToStart?: () => void
  private onJumpToEnd?: () => void

  constructor(container: HTMLElement, initialSettings: RSVPSettings, minimal: boolean = false) {
    this.container = container
    this.settings = initialSettings
    this.currentSpeed = initialSettings.speed
    this.minimal = minimal
    this.render()
    this.setupEventListeners()
  }

  private render(): void {
    if (this.minimal) {
      this.container.innerHTML = `
        <div class="reading-controls minimal">
          <div class="speed-minimal">
            <button id="speed-down" class="speed-btn" aria-label="Slower"><i data-lucide="minus"></i></button>
            <button id="minimal-play-pause" class="play-pause-minimal" data-playing="true" aria-label="Pause"><i data-lucide="pause"></i></button>
            <button id="speed-up" class="speed-btn" aria-label="Faster"><i data-lucide="plus"></i></button>
          </div>
        </div>
      `
      ;(window as any).lucide?.createIcons()
      return
    }

    this.container.innerHTML = `
      <div class="reading-controls">
        <!-- Main Play/Pause Control -->
        <div class="main-controls">
          <button id="play-pause-btn" class="play-pause-btn" data-playing="false" aria-label="Play/Pause">
            <i id="play-pause-icon" data-lucide="play"></i>
          </button>
        </div>

        <!-- Speed Controls -->
        <div class="speed-controls">
          <div class="speed-presets">
            <button class="speed-preset ${this.currentSpeed === 150 ? 'active' : ''}" data-speed="150">Slow</button>
            <button class="speed-preset ${this.currentSpeed === 250 ? 'active' : ''}" data-speed="250">Medium</button>
            <button class="speed-preset ${this.currentSpeed === 400 ? 'active' : ''}" data-speed="400">Fast</button>
          </div>
          
          <div class="speed-slider-container">
            <input 
              type="range" 
              id="speed-slider" 
              min="150" 
              max="600" 
              value="${this.currentSpeed}"
              step="25"
              class="speed-slider"
            />
            <span id="speed-display" class="speed-display">${this.currentSpeed} WPM</span>
          </div>
        </div>

        <!-- Navigation Controls -->
        <div class="navigation-controls">
          <button id="jump-to-start" class="nav-btn" title="Jump to start" aria-label="Jump to start">
            <i data-lucide="skip-back"></i>
          </button>
          <button id="replay-sentence" class="nav-btn" title="Replay sentence" aria-label="Replay sentence">
            <i data-lucide="rotate-ccw"></i>
          </button>
          <button id="replay-paragraph" class="nav-btn" title="Replay paragraph" aria-label="Replay paragraph">
            <i data-lucide="rotate-ccw"></i>
          </button>
          <button id="jump-to-end" class="nav-btn" title="Jump to end" aria-label="Jump to end">
            <i data-lucide="skip-forward"></i>
          </button>
        </div>

        <!-- Settings Toggle -->
        <div class="settings-controls">
          <button id="settings-toggle" class="settings-btn" aria-label="Settings">
            <i data-lucide="settings"></i>
          </button>
          
          <div id="settings-panel" class="settings-panel" style="display: none;">
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  id="pause-sentences" 
                  ${this.settings.pauseAtSentences ? 'checked' : ''}
                />
                Pause at sentences
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  id="pause-paragraphs" 
                  ${this.settings.pauseAtParagraphs ? 'checked' : ''}
                />
                Pause at paragraphs
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  id="skip-function-words" 
                  ${this.settings.skipFunctionWords ? 'checked' : ''}
                />
                Skip function words (high speed)
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  id="highlight-key-terms" 
                  ${this.settings.highlightKeyTerms ? 'checked' : ''}
                />
                Highlight key terms
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  id="orp-enabled" 
                  ${this.settings.orpEnabled ? 'checked' : ''}
                />
                Show Optimal Recognition Point
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                Session time limit (minutes):
                <input 
                  type="number" 
                  id="session-time-limit" 
                  value="${this.settings.sessionTimeLimit}"
                  min="5"
                  max="60"
                  class="time-input"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    `
    ;(window as any).lucide?.createIcons()
  }

  private setupEventListeners(): void {
    if (this.minimal) {
      // Minimal speed buttons only
      const down = this.container.querySelector('#speed-down') as HTMLButtonElement | null
      const up = this.container.querySelector('#speed-up') as HTMLButtonElement | null
      const pp = this.container.querySelector('#minimal-play-pause') as HTMLButtonElement | null
      down?.addEventListener('click', () => {
        this.setSpeed(Math.max(150, this.currentSpeed - 25))
      })
      up?.addEventListener('click', () => {
        this.setSpeed(Math.min(600, this.currentSpeed + 25))
      })
      pp?.addEventListener('click', () => {
        if (this.isPlaying) {
          this.pause()
        } else {
          this.play()
        }
      })
      return
    }

    // Play/Pause button
    const playPauseBtn = this.container.querySelector('#play-pause-btn') as HTMLButtonElement
    playPauseBtn.addEventListener('click', () => {
      this.togglePlayPause()
    })

    // Speed presets
    const speedPresets = this.container.querySelectorAll('.speed-preset')
    speedPresets.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseInt((e.target as HTMLElement).dataset.speed!)
        this.setSpeed(speed)
      })
    })

    // Speed slider
    const speedSlider = this.container.querySelector('#speed-slider') as HTMLInputElement
    speedSlider.addEventListener('input', (e) => {
      const speed = parseInt((e.target as HTMLInputElement).value)
      this.updateSpeedDisplay(speed)
    })

    speedSlider.addEventListener('change', (e) => {
      const speed = parseInt((e.target as HTMLInputElement).value)
      this.setSpeed(speed)
    })

    // Navigation controls
    const jumpToStart = this.container.querySelector('#jump-to-start') as HTMLButtonElement
    jumpToStart.addEventListener('click', () => {
      this.onJumpToStart?.()
    })

    const replaySentence = this.container.querySelector('#replay-sentence') as HTMLButtonElement
    replaySentence.addEventListener('click', () => {
      this.onReplaySentence?.()
    })

    const replayParagraph = this.container.querySelector('#replay-paragraph') as HTMLButtonElement
    replayParagraph.addEventListener('click', () => {
      this.onReplayParagraph?.()
    })

    const jumpToEnd = this.container.querySelector('#jump-to-end') as HTMLButtonElement
    jumpToEnd.addEventListener('click', () => {
      this.onJumpToEnd?.()
    })

    // Settings toggle
    const settingsToggle = this.container.querySelector('#settings-toggle') as HTMLButtonElement
    const settingsPanel = this.container.querySelector('#settings-panel') as HTMLElement
    
    settingsToggle.addEventListener('click', () => {
      const isVisible = settingsPanel.style.display !== 'none'
      settingsPanel.style.display = isVisible ? 'none' : 'block'
    })

    // Settings checkboxes
    this.setupSettingsListeners()
  }

  private setupSettingsListeners(): void {
    const pauseSentences = this.container.querySelector('#pause-sentences') as HTMLInputElement
    pauseSentences.addEventListener('change', (e) => {
      this.settings.pauseAtSentences = (e.target as HTMLInputElement).checked
      this.notifySettingsChange()
    })

    const pauseParagraphs = this.container.querySelector('#pause-paragraphs') as HTMLInputElement
    pauseParagraphs.addEventListener('change', (e) => {
      this.settings.pauseAtParagraphs = (e.target as HTMLInputElement).checked
      this.notifySettingsChange()
    })

    const skipFunctionWords = this.container.querySelector('#skip-function-words') as HTMLInputElement
    skipFunctionWords.addEventListener('change', (e) => {
      this.settings.skipFunctionWords = (e.target as HTMLInputElement).checked
      this.notifySettingsChange()
    })

    const highlightKeyTerms = this.container.querySelector('#highlight-key-terms') as HTMLInputElement
    highlightKeyTerms.addEventListener('change', (e) => {
      this.settings.highlightKeyTerms = (e.target as HTMLInputElement).checked
      this.notifySettingsChange()
    })

    const orpEnabled = this.container.querySelector('#orp-enabled') as HTMLInputElement
    orpEnabled.addEventListener('change', (e) => {
      this.settings.orpEnabled = (e.target as HTMLInputElement).checked
      this.notifySettingsChange()
    })

    const sessionTimeLimit = this.container.querySelector('#session-time-limit') as HTMLInputElement
    sessionTimeLimit.addEventListener('change', (e) => {
      this.settings.sessionTimeLimit = parseInt((e.target as HTMLInputElement).value)
      this.notifySettingsChange()
    })
  }

  private notifySettingsChange(): void {
    // Dispatch custom event for settings changes
    const event = new CustomEvent('settingsChange', { 
      detail: { settings: this.settings } 
    })
    this.container.dispatchEvent(event)
  }

  private togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  private play(): void {
    this.isPlaying = true
    this.updatePlayPauseButton()
    this.updateMinimalPlayPauseButton()
    this.onPlay?.()
  }

  private pause(): void {
    this.isPlaying = false
    this.updatePlayPauseButton()
    this.updateMinimalPlayPauseButton()
    this.onPause?.()
  }

  private updatePlayPauseButton(): void {
    const btn = this.container.querySelector('#play-pause-btn') as HTMLButtonElement | null
    if (!btn) return
    btn.dataset.playing = this.isPlaying.toString()
    const icon = btn.querySelector('#play-pause-icon') as HTMLElement | null
    if (icon) {
      const next = this.isPlaying ? 'pause' : 'play'
      icon.setAttribute('data-lucide', next)
      // Re-render icon
      ;(window as any).lucide?.createIcons()
    }
  }

  private updateMinimalPlayPauseButton(): void {
    const btn = this.container.querySelector('#minimal-play-pause') as HTMLButtonElement | null
    if (!btn) return
    btn.dataset.playing = this.isPlaying.toString()
    const next = this.isPlaying ? 'pause' : 'play'
    btn.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Play')
    btn.innerHTML = `<i data-lucide="${next}"></i>`
    ;(window as any).lucide?.createIcons()
  }

  private setSpeed(speed: number): void {
    this.currentSpeed = speed
    this.updateSpeedDisplay(speed)
    this.updateSpeedPresets(speed)
    this.onSpeedChange?.(speed)
  }

  private updateSpeedDisplay(speed: number): void {
    const display = this.container.querySelector('#speed-display') as HTMLElement | null
    if (display) display.textContent = `${speed} WPM`
    
    const slider = this.container.querySelector('#speed-slider') as HTMLInputElement | null
    if (slider) slider.value = speed.toString()
  }

  private updateSpeedPresets(speed: number): void {
    const presets = this.container.querySelectorAll('.speed-preset')
    presets.forEach(preset => {
      const presetSpeed = parseInt((preset as HTMLElement).dataset.speed!)
      preset.classList.toggle('active', presetSpeed === speed)
    })
  }

  // Public methods for external control
  setPlayState(playing: boolean): void {
    this.isPlaying = playing
    this.updatePlayPauseButton()
  }

  // Event handler setters
  setPlayHandler(handler: () => void): void {
    this.onPlay = handler
  }

  setPauseHandler(handler: () => void): void {
    this.onPause = handler
  }

  setSpeedChangeHandler(handler: (speed: number) => void): void {
    this.onSpeedChange = handler
  }

  setReplaySentenceHandler(handler: () => void): void {
    this.onReplaySentence = handler
  }

  setReplayParagraphHandler(handler: () => void): void {
    this.onReplayParagraph = handler
  }

  setJumpToStartHandler(handler: () => void): void {
    this.onJumpToStart = handler
  }

  setJumpToEndHandler(handler: () => void): void {
    this.onJumpToEnd = handler
  }

  getSettings(): RSVPSettings {
    return { ...this.settings }
  }
}
