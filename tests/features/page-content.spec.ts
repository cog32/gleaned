import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

describe('Page Content Verification', () => {
  const distPath = join(process.cwd(), 'dist')

  describe('Main Page (index.html)', () => {
    it('should exist in dist folder', () => {
      const indexPath = join(distPath, 'index.html')
      expect(existsSync(indexPath)).toBe(true)
    })

    it('should have correct title "Gleaned - Clean Reading Experience"', () => {
      const indexPath = join(distPath, 'index.html')
      const content = readFileSync(indexPath, 'utf-8')
      expect(content).toContain('<title>Gleaned - Clean Reading Experience</title>')
    })

    it('should not contain "Gleaned Bridge" text', () => {
      const indexPath = join(distPath, 'index.html')
      const content = readFileSync(indexPath, 'utf-8')
      expect(content).not.toContain('Gleaned Bridge')
      expect(content).not.toContain('Keeping this tab open while we transfer the extractor')
    })

    it('should have the bookmarklet section', () => {
      const indexPath = join(distPath, 'index.html')
      const content = readFileSync(indexPath, 'utf-8')
      expect(content).toContain('bookmarklet-section')
      expect(content).toContain('📖 Read Any Article with Gleaned')
    })

    it('should have the support footer with Buy Me a Coffee link', () => {
      const indexPath = join(distPath, 'index.html')
      const content = readFileSync(indexPath, 'utf-8')
      expect(content).toContain('support-footer')
      expect(content).toContain('Enjoying Gleaned?')
      expect(content).toContain('https://buymeacoffee.com/cog32')
      expect(content).toContain('☕ Buy me a coffee')
    })

    it('should have the main content section', () => {
      const indexPath = join(distPath, 'index.html')
      const content = readFileSync(indexPath, 'utf-8')
      expect(content).toContain('id="content-section"')
      expect(content).toContain('class="container"')
    })
  })

  describe('Reading Page (reading.html)', () => {
    it('should exist in dist folder', () => {
      const readingPath = join(distPath, 'reading.html')
      expect(existsSync(readingPath)).toBe(true)
    })

    it('should have correct title "Reading - Gleaned"', () => {
      const readingPath = join(distPath, 'reading.html')
      const content = readFileSync(readingPath, 'utf-8')
      expect(content).toContain('<title>Reading - Gleaned</title>')
    })

    it('should have the support footer', () => {
      const readingPath = join(distPath, 'reading.html')
      const content = readFileSync(readingPath, 'utf-8')
      expect(content).toContain('support-footer')
      expect(content).toContain('buymeacoffee.com/cog32')
    })

    it('should have RSVP display section', () => {
      const readingPath = join(distPath, 'reading.html')
      const content = readFileSync(readingPath, 'utf-8')
      expect(content).toContain('rsvp-section')
      expect(content).toContain('reading-container')
    })
  })

  describe('Ingest Page (ingest.html)', () => {
    it('should exist in dist folder', () => {
      const ingestPath = join(distPath, 'ingest.html')
      expect(existsSync(ingestPath)).toBe(true)
    })

    it('should have correct title "Content Ingested - Gleaned"', () => {
      const ingestPath = join(distPath, 'ingest.html')
      const content = readFileSync(ingestPath, 'utf-8')
      expect(content).toContain('<title>Content Ingested - Gleaned</title>')
    })

    it('should have the support footer', () => {
      const ingestPath = join(distPath, 'ingest.html')
      const content = readFileSync(ingestPath, 'utf-8')
      expect(content).toContain('support-footer')
      expect(content).toContain('buymeacoffee.com/cog32')
    })

    it('should have ingest container and status', () => {
      const ingestPath = join(distPath, 'ingest.html')
      const content = readFileSync(ingestPath, 'utf-8')
      expect(content).toContain('ingest-container')
      expect(content).toContain('ingest-status')
    })
  })

  describe('Bridge Page (bridge/index.html)', () => {
    it('should exist in dist folder', () => {
      const bridgePath = join(distPath, 'bridge', 'index.html')
      expect(existsSync(bridgePath)).toBe(true)
    })

    it('should have correct title "Gleaned Bridge"', () => {
      const bridgePath = join(distPath, 'bridge', 'index.html')
      const content = readFileSync(bridgePath, 'utf-8')
      expect(content).toContain('<title>Gleaned Bridge</title>')
    })

    it('should contain bridge-specific content', () => {
      const bridgePath = join(distPath, 'bridge', 'index.html')
      const content = readFileSync(bridgePath, 'utf-8')
      expect(content).toContain('Gleaned Bridge')
      expect(content).toContain('Keeping this tab open while we transfer the extractor')
    })

    it('should have service worker registration script', () => {
      const bridgePath = join(distPath, 'bridge', 'index.html')
      const content = readFileSync(bridgePath, 'utf-8')
      expect(content).toContain('registerServiceWorker')
      expect(content).toContain('navigator.serviceWorker')
    })
  })

  describe('Page Separation', () => {
    it('should ensure index.html and bridge/index.html are different files', () => {
      const indexPath = join(distPath, 'index.html')
      const bridgePath = join(distPath, 'bridge', 'index.html')

      const indexContent = readFileSync(indexPath, 'utf-8')
      const bridgeContent = readFileSync(bridgePath, 'utf-8')

      expect(indexContent).not.toBe(bridgeContent)
    })

    it('should ensure main page has different content than bridge page', () => {
      const indexPath = join(distPath, 'index.html')
      const bridgePath = join(distPath, 'bridge', 'index.html')

      const indexContent = readFileSync(indexPath, 'utf-8')
      const bridgeContent = readFileSync(bridgePath, 'utf-8')

      // Main page should not have bridge text
      expect(indexContent).not.toContain('Keeping this tab open while we transfer the extractor')

      // Bridge page should not have main page content
      expect(bridgeContent).not.toContain('bookmarklet-section')
      expect(bridgeContent).not.toContain('url-input-container')
    })
  })

  describe('Footer Consistency', () => {
    it('should have footer on all main pages except bridge', () => {
      const pages = [
        { path: join(distPath, 'index.html'), name: 'index' },
        { path: join(distPath, 'reading.html'), name: 'reading' },
        { path: join(distPath, 'ingest.html'), name: 'ingest' },
      ]

      pages.forEach(({ path, name }) => {
        const content = readFileSync(path, 'utf-8')
        expect(content, `${name} page should have footer`).toContain('support-footer')
        expect(content, `${name} page should have Buy Me a Coffee link`).toContain('buymeacoffee.com/cog32')
      })
    })
  })
})
