import type { Article } from '../types/content.js'

export class ContentDisplayComponent {
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  render(article: Article): void {
    this.container.innerHTML = `
      <div id="article-display" class="article-display">
        <header class="article-header">
          <h1 id="article-title" class="article-title">${article.title}</h1>
          <div class="article-meta">
            <span id="article-author" class="article-author">${article.author || ''}</span>
            ${article.author ? ' • ' : ''}
            <span id="article-date" class="article-date">Added on ${article.dateAdded}</span>
          </div>
          <div class="article-info">
            <span id="article-source" class="article-source">${article.source}</span>
            <span id="reading-time" class="reading-time">${article.readingTime}MIN</span>
          </div>
        </header>
        <div id="article-content" class="article-content">
          ${article.cleanedContent}
        </div>
      </div>
    `
  }

  hide(): void {
    this.container.innerHTML = ''
  }

  showError(message: string): void {
    this.container.innerHTML = `
      <div class="error-message">
        <h2>Failed to load content</h2>
        <p>${message}</p>
        <button onclick="location.reload()" class="retry-button">Try Again</button>
      </div>
    `
  }

  showLoading(): void {
    this.container.innerHTML = `
      <div id="loading-indicator" class="loading-indicator">
        <div class="loading-spinner"></div>
        <p>Loading article content...</p>
      </div>
    `
  }
}