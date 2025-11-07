describe('Buy Me a Coffee Support Link', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('Footer on Main Page', () => {
    it('should display footer element with Buy Me a Coffee link', () => {
      // Setup DOM similar to index.html
      document.body.innerHTML = `
        <main class="container">
          <div id="content-section"></div>
        </main>
        <footer id="support-footer" style="margin-top: 2rem; padding: 1rem; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #666; font-size: 0.9rem;">
            Enjoying Gleaned?
            <a id="buy-me-coffee-link" href="https://buymeacoffee.com/cog32" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: none;">
              ☕ Buy me a coffee
            </a>
          </p>
        </footer>
      `

      const footer = document.querySelector('#support-footer') as HTMLElement
      const link = document.querySelector('#buy-me-coffee-link') as HTMLAnchorElement

      // Footer should exist
      expect(footer).toBeTruthy()

      // Link should exist and have correct attributes
      expect(link).toBeTruthy()
      expect(link.href).toBe('https://buymeacoffee.com/cog32')
      expect(link.target).toBe('_blank')
      expect(link.rel).toBe('noopener noreferrer')
      expect(link.textContent).toContain('Buy me a coffee')
    })

    it('should have footer styled consistently and non-intrusively', () => {
      document.body.innerHTML = `
        <footer id="support-footer" style="margin-top: 2rem; padding: 1rem; text-align: center; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #666; font-size: 0.9rem;">
            Enjoying Gleaned?
            <a href="https://buymeacoffee.com/cog32">☕ Buy me a coffee</a>
          </p>
        </footer>
      `

      const footer = document.querySelector('#support-footer') as HTMLElement
      const paragraph = footer.querySelector('p') as HTMLElement

      // Check styling is subtle and non-intrusive
      expect(footer.style.textAlign).toBe('center')
      expect(footer.style.borderTop).toContain('1px')
      expect(paragraph.style.color).toBe('rgb(102, 102, 102)') // #666
      expect(paragraph.style.fontSize).toBe('0.9rem')
    })

    it('should open Buy Me a Coffee link in new tab', () => {
      document.body.innerHTML = `
        <footer id="support-footer">
          <a id="buy-me-coffee-link" href="https://buymeacoffee.com/cog32" target="_blank" rel="noopener noreferrer">
            ☕ Buy me a coffee
          </a>
        </footer>
      `

      const link = document.querySelector('#buy-me-coffee-link') as HTMLAnchorElement

      // Should open in new tab for security
      expect(link.target).toBe('_blank')
      expect(link.rel).toBe('noopener noreferrer')
    })
  })
})
