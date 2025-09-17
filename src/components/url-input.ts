export class UrlInputComponent {
  private container: HTMLElement
  private urlInput: HTMLInputElement
  private loadButton: HTMLButtonElement
  private onLoad?: (url: string) => void

  constructor(container: HTMLElement) {
    this.container = container
    this.render()
    this.urlInput = this.container.querySelector('#url-input') as HTMLInputElement
    this.loadButton = this.container.querySelector('#load-button') as HTMLButtonElement
    this.setupEventListeners()
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="url-input-container">
        <div class="input-group">
          <input 
            id="url-input" 
            type="url" 
            placeholder="Enter article URL..." 
            class="url-input"
            autocomplete="url"
            spellcheck="false"
          />
          <button id="load-button" class="load-button" disabled>
            Load
          </button>
        </div>
      </div>
    `
  }

  private setupEventListeners(): void {
    this.urlInput.addEventListener('input', () => {
      this.validateUrl()
    })

    this.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.loadButton.disabled) {
        this.handleLoad()
      }
    })

    this.loadButton.addEventListener('click', () => {
      this.handleLoad()
    })
  }

  private validateUrl(): void {
    const url = this.urlInput.value.trim()
    const isValid = this.isValidUrl(url)
    this.loadButton.disabled = !isValid
    
    if (url && !isValid) {
      this.urlInput.setCustomValidity('Please enter a valid URL')
    } else {
      this.urlInput.setCustomValidity('')
    }
  }

  private isValidUrl(string: string): boolean {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  private handleLoad(): void {
    const url = this.urlInput.value.trim()
    if (this.isValidUrl(url) && this.onLoad) {
      this.onLoad(url)
    }
  }

  setLoadCallback(callback: (url: string) => void): void {
    this.onLoad = callback
  }

  setLoading(loading: boolean): void {
    this.loadButton.disabled = loading
    this.loadButton.textContent = loading ? 'Loading...' : 'Load'
    this.urlInput.disabled = loading
  }

  clear(): void {
    this.urlInput.value = ''
    this.loadButton.disabled = true
  }

  setError(message: string): void {
    this.urlInput.setCustomValidity(message)
    this.urlInput.reportValidity()
  }
}