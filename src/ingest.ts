import { ContentCleaner } from './utils/content-cleaner.js'
import { ArticleExtractor } from './utils/article-extractor.js'
import type { Article } from './types/content.js'

interface IngestedContent {
  id: string
  url: string
  title: string
  html: string
  timestamp: number
  source: 'bookmarklet'
  author?: string
}

class IngestApp {
  private statusElement: HTMLElement
  private previewElement: HTMLElement
  private actionsElement: HTMLElement
  private currentContent: IngestedContent | null = null
  private processedArticle: Article | null = null

  constructor() {
    this.statusElement = document.getElementById('ingest-status')!
    this.previewElement = document.getElementById('content-preview')!
    this.actionsElement = document.getElementById('ingest-actions')!
    
    this.setupEventHandlers()
    this.loadIngestedContent()
  }

  private setupEventHandlers(): void {
    const startReadingBtn = document.getElementById('start-reading-btn')!
    startReadingBtn.addEventListener('click', () => {
      this.startReading()
    })

    const viewArticleBtn = document.getElementById('view-article-btn')!
    viewArticleBtn.addEventListener('click', () => {
      this.viewFullArticle()
    })
  }

  private async loadIngestedContent(): Promise<void> {
    try {
      // Request latest content from service worker
      let content = await this.getLatestContentFromSW()
      
      // Fallback to dev API if SW has nothing
      if (!content) {
        console.log('ℹ️ No content from SW, trying /api/latest-content fallback')
        content = await this.getLatestContentFromAPI()
      }
      
      if (!content) {
        this.showError('No content found. Please use the bookmarklet to extract content from an article.')
        return
      }

      this.currentContent = content
      await this.processContent()
      
    } catch (error) {
      console.error('Failed to load ingested content:', error)
      this.showError('Failed to load content. Please try using the bookmarklet again.')
    }
  }

  private async getLatestContentFromSW(): Promise<IngestedContent | null> {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        console.warn('Service worker not available or not controlling page')
        resolve(null)
        return
      }

      console.log('🔄 Requesting latest content from service worker')

      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        const { success, content, error } = event.data
        console.log('📨 Service worker response:', { success, hasContent: !!content, error })
        
        if (success) {
          resolve(content)
        } else {
          console.warn('Service worker returned error:', error)
          resolve(null)
        }
      }

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_LATEST_CONTENT' },
        [messageChannel.port2]
      )
    })
  }

  private async getLatestContentFromAPI(): Promise<IngestedContent | null> {
    try {
      const res = await fetch('/api/latest-content', { headers: { 'Accept': 'application/json' } })
      if (!res.ok) return null
      const data = await res.json()
      return data?.success ? data.content as IngestedContent : null
    } catch {
      return null
    }
  }

  private async processContent(): Promise<void> {
    if (!this.currentContent) return

    try {
      // Update status
      this.updateStatus('🔄', 'Processing Content...', 'Cleaning and preparing article for optimal reading')

      // Try robust extraction via Readability (loaded if needed), then fallback
      const extraction = await ArticleExtractor.extract(this.currentContent.html, this.currentContent.url)
      const cleanedContent = extraction.contentHTML
      const textContent = extraction.text
      const wordCount = ContentCleaner.countWords(textContent)
      const readingTime = ContentCleaner.estimateReadingTime(wordCount)

      // Extract title and author if not provided
      let title = this.currentContent.title || extraction.title
      let author = this.currentContent.author

      if (!title || title === 'Untitled Article') {
        title = this.extractTitleFromContent(cleanedContent) || 'Untitled Article'
      }

      if (!author) {
        author = this.extractAuthorFromContent(this.currentContent.html)
      }

      // Create processed article
      this.processedArticle = {
        id: this.currentContent.id,
        title: title,
        author: author,
        source: this.extractDomain(this.currentContent.url),
        url: this.currentContent.url,
        dateAdded: new Date(this.currentContent.timestamp).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        readingTime: readingTime,
        wordCount: wordCount,
        content: this.currentContent.html,
        cleanedContent: cleanedContent
      }

      // Show success and preview
      this.showSuccess()
      this.showContentPreview()

      // Clear the ingested content from service worker storage
      await this.clearIngestedContent(this.currentContent.id)

    } catch (error) {
      console.error('Content processing failed:', error)
      this.showError('Failed to process content. The article format may not be supported.')
    }
  }

  private extractTitleFromContent(html: string): string | null {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      const titleSelectors = [
        'h1',
        '.title',
        '.post-title',
        '.entry-title',
        '.article-title'
      ]

      for (const selector of titleSelectors) {
        const element = doc.querySelector(selector)
        if (element?.textContent?.trim()) {
          return element.textContent.trim()
        }
      }

      return null
    } catch {
      return null
    }
  }

  private extractAuthorFromContent(html: string): string | undefined {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      const authorSelectors = [
        '[rel="author"]',
        '.author',
        '.byline',
        '.post-author',
        '.article-author',
        '[itemprop="author"]'
      ]

      for (const selector of authorSelectors) {
        const element = doc.querySelector(selector)
        if (element?.textContent?.trim()) {
          return element.textContent.trim()
        }
      }

      return undefined
    } catch {
      return undefined
    }
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '').toUpperCase()
    } catch {
      return 'UNKNOWN'
    }
  }

  private updateStatus(icon: string, title: string, message: string): void {
    this.statusElement.innerHTML = `
      <div class="ingest-icon">${icon}</div>
      <div class="ingest-title">${title}</div>
      <div class="ingest-message">${message}</div>
    `
  }

  private showSuccess(): void {
    this.updateStatus('✅', 'Content Ready!', 'Your article has been processed and is ready for speed reading')
    this.statusElement.classList.remove('error-state')
    this.actionsElement.style.display = 'flex'
  }

  private showError(message: string): void {
    this.updateStatus('⚠️', 'Processing Failed', message)
    this.statusElement.classList.add('error-state')
    
    // Show limited actions
    this.actionsElement.innerHTML = `
      <a href="index.html" class="action-btn primary-btn">
        Back to Main Page
      </a>
      <button onclick="location.reload()" class="action-btn secondary-btn">
        Try Again
      </button>
    `
    this.actionsElement.style.display = 'flex'
  }

  private showContentPreview(): void {
    if (!this.processedArticle) return

    // Create preview of the content
    const previewLength = 500
    const textContent = ContentCleaner.extractText(this.processedArticle.cleanedContent)
    const preview = textContent.substring(0, previewLength) + (textContent.length > previewLength ? '...' : '')

    this.previewElement.innerHTML = `
      <div class="preview-title">${this.processedArticle.title}</div>
      <div class="preview-meta">
        <span><strong>Source:</strong> ${this.processedArticle.source}</span>
        <span><strong>Reading Time:</strong> ${this.processedArticle.readingTime} min</span>
        <span><strong>Words:</strong> ${this.processedArticle.wordCount.toLocaleString()}</span>
        ${this.processedArticle.author ? `<span><strong>Author:</strong> ${this.processedArticle.author}</span>` : ''}
      </div>
      <div class="preview-content">${preview}</div>
    `
    
    this.previewElement.style.display = 'block'
  }

  private startReading(): void {
    if (!this.processedArticle) return

    // Store the processed article for the reading page
    localStorage.setItem('currentArticle', JSON.stringify(this.processedArticle))
    
    // Navigate to reading page
    window.location.href = 'reading.html'
  }

  private viewFullArticle(): void {
    if (!this.processedArticle) return

    // Store the article and navigate to main page in view mode
    localStorage.setItem('currentArticle', JSON.stringify(this.processedArticle))
    window.location.href = 'index.html?view=true'
  }

  private async clearIngestedContent(id: string): Promise<void> {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        resolve() // Silently succeed if SW not available
        return
      }

      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        const { success, error } = event.data
        if (success) {
          resolve()
        } else {
          console.warn('Failed to clear ingested content:', error)
          resolve() // Don't fail the whole process
        }
      }

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_INGESTED_CONTENT', payload: { id } },
        [messageChannel.port2]
      )
    })
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new IngestApp()
})
