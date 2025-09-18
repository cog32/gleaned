// Gleaned Bookmarklet
// This script extracts content from the current page and sends it to the PWA

(function () {
  'use strict';

  const globalObj = typeof window !== 'undefined' ? window : globalThis;

  // Configuration - prefer origin injected by the loader/bridge
  const scriptEl = (function () {
    try {
      return document.currentScript || Array.from(document.scripts).find(s => s.src && s.src.includes('extractor.bundle.js'))
    } catch (_) {
      return null
    }
  })();

  const PWA_ORIGIN = (() => {
    const injected = globalObj.__GLEAMED_PWA_ORIGIN;
    if (typeof injected === 'string' && injected) {
      return injected;
    }

    try {
      if (scriptEl && scriptEl.src) {
        return new URL(scriptEl.src).origin;
      }
    } catch (_) { }

    return 'http://localhost:3000';
  })();

  const bridge = globalObj.__GLEAMED_BRIDGE__ || null;

  // Create loading indicator
  function createLoadingIndicator() {
    const overlay = document.createElement('div');
    overlay.id = 'gleaned-loading';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 18px;
      z-index: 999999;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">📖</div>
        <div>Extracting content for Gleaned...</div>
        <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Processing article content</div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  // Remove loading indicator
  function removeLoadingIndicator() {
    const overlay = document.getElementById('gleaned-loading');
    if (overlay) {
      overlay.remove();
    }
  }

  // Attempt to load Readability (best-effort)
  async function ensureReadability() {
    if (window.Readability) return true;
    // Prefer loading from the PWA origin to work offline
    const localSrcs = [
      `${PWA_ORIGIN}/vendor/Readability.js`,
      `${PWA_ORIGIN}/vendor/readability.js`
    ];
    for (const src of localSrcs) {
      try {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.async = true;
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
        if (window.Readability) return true;
      } catch { }
    }
    return false;
  }

  // Extract article content using Readability if available, otherwise heuristics
  async function extractContent() {
    let title = '';
    let content = '';
    let author = '';

    try {
      const hasReadability = await ensureReadability();
      if (hasReadability && window.Readability) {
        const docClone = document.cloneNode(true);
        const article = new window.Readability(docClone).parse();
        if (article && article.content) {
          title = article.title || document.title || title;
          content = article.content;
          author = article.byline || author;
          return {
            title: String(title || '').trim(),
            author: String(author || '').trim(),
            content: content,
            url: window.location.href,
            timestamp: Date.now()
          };
        }
      }
    } catch (e) {
      // Ignore readability failures and fallback
    }

    // Strategy 1: Try structured data (JSON-LD)
    try {
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'Article' || data['@type'] === 'NewsArticle') {
          title = data.headline || data.name || title;
          author = data.author?.name || data.author || author;
          break;
        }
      }
    } catch (e) {
      // Ignore JSON-LD parsing errors
    }

    // Strategy 2: Try Open Graph and meta tags
    title = title ||
      document.querySelector('meta[property="og:title"]')?.content ||
      document.querySelector('meta[name="twitter:title"]')?.content ||
      document.querySelector('title')?.textContent ||
      '';

    // Ensure title is a string
    if (typeof title !== 'string') {
      title = title ? String(title) : '';
    }

    author = author ||
      document.querySelector('meta[name="author"]')?.content ||
      document.querySelector('meta[property="article:author"]')?.content ||
      document.querySelector('[rel="author"]')?.textContent ||
      '';

    // Ensure author is a string
    if (typeof author !== 'string') {
      author = author ? String(author) : '';
    }

    // Strategy 3: Find main content area
    const contentSelectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content',
      '.post-body',
      '.entry-body'
    ];

    let mainContent = null;
    for (const selector of contentSelectors) {
      mainContent = document.querySelector(selector);
      if (mainContent && mainContent.textContent.trim().length > 100) {
        break;
      }
    }

    // Strategy 4: If no main content found, try to find the largest text block
    if (!mainContent) {
      const candidates = document.querySelectorAll('div, section, article');
      let bestCandidate = null;
      let maxTextLength = 0;

      for (const candidate of candidates) {
        // Skip navigation, header, footer, sidebar elements
        const tagName = candidate.tagName.toLowerCase();
        const className = candidate.className.toLowerCase();
        const id = candidate.id.toLowerCase();

        if (className.includes('nav') || className.includes('menu') ||
          className.includes('sidebar') || className.includes('footer') ||
          className.includes('header') || className.includes('ads') ||
          id.includes('nav') || id.includes('menu') || id.includes('sidebar')) {
          continue;
        }

        const textLength = candidate.textContent.trim().length;
        if (textLength > maxTextLength && textLength > 200) {
          maxTextLength = textLength;
          bestCandidate = candidate;
        }
      }

      mainContent = bestCandidate;
    }

    // Clean up the content
    if (mainContent) {
      // Clone the content to avoid modifying the original page
      const contentClone = mainContent.cloneNode(true);

      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'noscript',
        '.ads', '.advertisement', '.ad',
        '.social-share', '.share-buttons',
        '.comments', '.comment-section',
        '.newsletter-signup', '.subscription',
        '.related-articles', '.recommended',
        'nav', 'header', 'footer',
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
      ];

      unwantedSelectors.forEach(selector => {
        const elements = contentClone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      content = contentClone.innerHTML;
    } else {
      // Fallback: use the entire body but clean it up
      content = document.body.innerHTML;
    }

    return {
      title: String(title || '').trim(),
      author: String(author || '').trim(),
      content: content,
      url: window.location.href,
      timestamp: Date.now()
    };
  }

  // Send content to PWA
  async function sendToPWA(contentData) {
    const payload = {
      html: contentData.content,
      url: contentData.url,
      title: contentData.title,
      author: contentData.author,
      timestamp: contentData.timestamp
    };

    try {
      console.log('Gleaned: Sending content to PWA', {
        origin: PWA_ORIGIN,
        hasContent: !!contentData.content,
        contentLength: contentData.content?.length,
        url: contentData.url,
        title: contentData.title,
        viaBridge: !!bridge
      });

      if (bridge && typeof bridge.call === 'function') {
        const result = await bridge.call('push-content', payload);

        if (result && result.success) {
          const redirectTo = result.redirectTo || '/ingest';
          if (typeof bridge.navigate === 'function') {
            bridge.navigate(redirectTo);
          } else {
            window.open(`${PWA_ORIGIN}${redirectTo}`, '_blank');
          }
          return true;
        }

        const errorMessage = result && result.error ? result.error : 'Bridge call failed';
        throw new Error(errorMessage);
      }

      const response = await fetch(`${PWA_ORIGIN}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Gleaned: Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        window.open(`${PWA_ORIGIN}/ingest`, '_blank');
        return true;
      }

      throw new Error(result.error || 'Unknown error occurred');

    } catch (error) {
      console.error('Gleaned: Failed to send content', error);

      alert(`Gleaned: Failed to send content to reader app.\n\nError: ${error.message}\n\nPlease make sure the Gleaned app is running and try again.`);
      return false;
    }
  }

  // Main execution
  async function main() {
    // Show loading indicator
    const loadingOverlay = createLoadingIndicator();

    try {
      // Extract content from current page
      const contentData = await extractContent();

      // Validate extracted content
      if (!contentData.content || contentData.content.trim().length < 50) {
        throw new Error('Could not find sufficient readable content on this page');
      }

      // Send to PWA
      const success = await sendToPWA(contentData);

      if (success) {
        if (bridge && typeof bridge.dispose === 'function') {
          bridge.dispose();
        }

        // Show success message briefly
        loadingOverlay.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
            <div>Content sent successfully!</div>
            <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Opening Gleaned...</div>
          </div>
        `;

        setTimeout(() => {
          removeLoadingIndicator();
        }, 1500);
      } else {
        removeLoadingIndicator();
      }

    } catch (error) {
      console.error('Gleaned: Extraction failed', error);
      removeLoadingIndicator();
      alert(`Gleaned: Failed to extract content.\n\nError: ${error.message}`);
    }
  }

  // Run the bookmarklet
  main();

})();
