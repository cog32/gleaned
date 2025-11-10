import { ContentDisplayComponent } from './components/content-display.js'
import { ContentCleaner } from './utils/content-cleaner.js'
import type { Article } from './types/content.js'

class MainApp {
  private contentDisplay: ContentDisplayComponent
  private playButton: HTMLButtonElement | null
  private currentArticle: Article | null = null

  constructor() {
    // Initialize components
    const contentSection = document.getElementById('content-section')!
    this.contentDisplay = new ContentDisplayComponent(contentSection)

    this.playButton = document.getElementById('play-button') as HTMLButtonElement | null

    this.setupEventListeners()
    this.showBookmarkletSection()
    this.checkForViewMode()
  }

  private setupEventListeners(): void {
    if (this.playButton) {
      this.playButton.addEventListener('click', () => {
        this.navigateToReading()
      })
    }
  }

  // URL-based loading removed in favor of bookmarklet and ingest flows

  private navigateToReading(): void {
    if (this.currentArticle) {
      window.location.href = 'reading.html'
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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private showBookmarkletSection(): void {
    const bookmarkletSection = document.getElementById('bookmarklet-section')!
    const bookmarkletLink = document.getElementById('bookmarklet-link') as HTMLAnchorElement | null
    const bookmarkletCodeTextarea = document.getElementById('bookmarklet-code') as HTMLTextAreaElement | null
    const copyButton = document.getElementById('copy-button') as HTMLButtonElement | null
    const copyFeedback = document.getElementById('copy-feedback') as HTMLSpanElement | null

    if (bookmarkletLink) {
      const href = this.buildBookmarkletHref(window.location.origin)
      bookmarkletLink.href = href

      // Also populate the textarea for mobile users
      if (bookmarkletCodeTextarea) {
        bookmarkletCodeTextarea.value = href
        bookmarkletCodeTextarea.rows = Math.max(3, Math.ceil(href.length / 80))
      }

      // Set up copy button
      if (copyButton && bookmarkletCodeTextarea && copyFeedback) {
        copyButton.addEventListener('click', async () => {
          try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(href)
              copyFeedback.textContent = '✅ Copied!'
              copyFeedback.style.color = '#059669'
            } else {
              // Fallback: select and copy
              bookmarkletCodeTextarea.select()
              bookmarkletCodeTextarea.setSelectionRange(0, href.length)
              const success = document.execCommand('copy')
              if (success) {
                copyFeedback.textContent = '✅ Copied!'
                copyFeedback.style.color = '#059669'
              } else {
                throw new Error('Copy command failed')
              }
            }

            // Clear feedback after 3 seconds
            setTimeout(() => {
              copyFeedback.textContent = ''
            }, 3000)
          } catch (error) {
            console.error('Copy failed:', error)
            copyFeedback.textContent = '❌ Copy failed - please select and copy manually'
            copyFeedback.style.color = '#dc2626'
          }
        })
      }

      if (import.meta.env.DEV) {
        console.log('[App] bookmarklet href preview:', href.slice(0, 120) + '…')
      }
    }

    bookmarkletSection.style.display = 'block'
  }

  private buildBookmarkletHref(origin: string): string {
    const configuredOrigin = (import.meta.env.VITE_PWA_ORIGIN ?? '').trim()
    const targetOrigin = configuredOrigin || origin
    const sanitizedOrigin = targetOrigin.replace(/'/g, "\\'")
    const codeLines = [
      "(() => {\n",
      "  'use strict';\n",
      `  const O='${sanitizedOrigin}';\n`,
      "  const B=O+'/bridge/';\n",
      "  console.log('[Bookmarklet] boot', { origin: O });\n",
      "  const W=window.open(B,'_blank');\n",
      "  if(!W){alert('Popup blocked');return;}\n",
      "  const pending=new Map();\n",
      "  const chunkMap=new Map();\n",
      "  let seq=0;let total=null;let extractorRequested=false;let extractorLoaded=false;\n",
      "  const registerMsg={type:'REGISTER_HOST',origin:window.location.origin};\n",
      "  function sendRegister(){if(!W||W.closed){window.clearInterval(registerTimer);return;}try{W.postMessage(registerMsg,O);console.log('[Bookmarklet] REGISTER_HOST ->',O);}catch(err){console.warn('[Bookmarklet] register failed',err);}}\n",
      "  const registerTimer=window.setInterval(sendRegister,500);\n",
      "  sendRegister();\n",
      "  function stopRegister(){window.clearInterval(registerTimer);}\n",
      "  function requestExtractor(){if(extractorRequested||extractorLoaded)return;extractorRequested=true;console.log('[Bookmarklet] requesting extractor');try{W.postMessage({type:'SEND_EXTRACTOR',want:'extractor@v1'},O);}catch(err){console.warn('[Bookmarklet] SEND_EXTRACTOR failed',err);}}\n",
      "  function inject(text){const blob=new Blob([text],{type:'text/javascript'});const url=URL.createObjectURL(blob);const s=document.createElement('script');s.src=url;s.onload=()=>{URL.revokeObjectURL(url);};document.documentElement.appendChild(s);}\n",
      "  function showOverlay(msg){try{var el=document.getElementById('gleaned-overlay');if(!el){el=document.createElement('div');el.id='gleaned-overlay';el.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);color:#fff;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;z-index:2147483647;text-align:center;padding:24px;';document.documentElement.appendChild(el);}el.textContent=msg;}catch(_){}}\n",
      "  function hideOverlay(){try{var el=document.getElementById('gleaned-overlay');if(el)el.remove();}catch(_){}}\n",
      "  async function minimalExtractAndSend(){showOverlay('Sending to Gleaned…');try{var payload={html:document.documentElement.outerHTML,url:window.location.href,title:document.title||'',author:'',timestamp:Date.now()};var r=await window.__GLEAMED_BRIDGE__.call('push-content',payload);if(r&&r.success){if(typeof window.__GLEAMED_BRIDGE__.navigate==='function'){window.__GLEAMED_BRIDGE__.navigate('/ingest');}else{window.open(O+'/ingest','_blank');}hideOverlay();return;}throw new Error((r&&r.error)||'Bridge push failed');}catch(err){try{var res=await fetch(O+'/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({html:document.documentElement.outerHTML,url:window.location.href,title:document.title||'',author:'',timestamp:Date.now()})});if(res&&res.ok){window.open(O+'/ingest','_blank');hideOverlay();return;}}catch(_){ }hideOverlay();alert('Gleaned: Unable to send content. Please try copying the URL into the app.');}}\n",
      "  function resolveBridge(id,error,result){const entry=pending.get(id);if(!entry)return;pending.delete(id);clearTimeout(entry.timer);if(error){const err=error instanceof Error?error:new Error(typeof error==='string'?error:'Bridge error');console.error('[Bookmarklet] bridge error',err);entry.reject(err);}else{console.log('[Bookmarklet] bridge response',id,result);entry.resolve(result);}}\n",
      "  function setupBridge(){console.log('[Bookmarklet] bridge ready');extractorLoaded=true;window.__GLEAMED_PWA_ORIGIN=O;window.__GLEAMED_BRIDGE__={call(action,payload){const id='g'+Date.now()+'-'+seq++;console.log('[Bookmarklet] bridge call',action);try{W.postMessage({type:'BRIDGE_CALL',id,action,payload},O);}catch(err){console.error('[Bookmarklet] BRIDGE_CALL postMessage failed',err);throw err;}return new Promise((resolve,reject)=>{const timer=window.setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('Bridge timed out'));}},15000);pending.set(id,{resolve,reject,timer});});},navigate(path){const suffix=(path&&path.charAt(0)==='/')?path:'/'+(path||'');const target=O+suffix;try{W.location.href=target;}catch(_){window.open(target,'_blank');}},dispose(){pending.clear();delete window.__GLEAMED_BRIDGE__;delete window.__GLEAMED_PWA_ORIGIN;window.removeEventListener('message',onMessage);stopRegister();}};}\n",
      "  function onMessage(event){if(event.origin!==O)return;const data=event.data||{};console.log('[Bookmarklet] message',data.type,data);if(data.type==='READY'){stopRegister();setupBridge();minimalExtractAndSend();}else if(data.type==='CODE_CHUNK'){if(extractorLoaded)return;if(total===null)total=data.total;if(!chunkMap.has(data.index)){chunkMap.set(data.index,data.data);}console.log('[Bookmarklet] chunk',chunkMap.size,'of',total);if(chunkMap.size>=total){stopRegister();setupBridge();const ordered=[...chunkMap.keys()].sort((a,b)=>a-b).map((key)=>chunkMap.get(key)).join('');inject(ordered);}}else if(data.type==='ERROR'){stopRegister();alert('Bridge error: '+data.message);}else if(data.type==='BRIDGE_RESPONSE'){resolveBridge(data.id,data.error,data.result);}}\n",
      "  window.addEventListener('message',onMessage);\n",
      "})();\n"
    ];

    const code = codeLines.join('');

    return `javascript:${code.replace(/\s+/g, ' ')}`
  }

  private checkForViewMode(): void {
    const urlParams = new URLSearchParams(window.location.search)
    const isViewMode = urlParams.get('view') === 'true'
    
    // Check for bookmarklet data in URL parameters
    const url = urlParams.get('url')
    const title = urlParams.get('title')
    const author = urlParams.get('author')
    const html = urlParams.get('html')
    
    if (url && title && html) {
      // Create article from bookmarklet data
      const cleanedContent = ContentCleaner.clean(html)
      const textContent = ContentCleaner.extractText(cleanedContent)
      const wordCount = ContentCleaner.countWords(textContent)

      const article: Article = {
        id: this.generateId(),
        title: title.trim() || 'Untitled',
        author: author?.trim() || '',
        source: this.extractDomain(url),
        url,
        dateAdded: new Date().toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        }),
        readingTime: ContentCleaner.estimateReadingTime(wordCount),
        wordCount,
        content: cleanedContent,
        cleanedContent
      }
      
      this.currentArticle = article
      this.contentDisplay.render(article)
      if (this.playButton) {
        this.playButton.disabled = false
      }

      // Store in localStorage for reading page
      localStorage.setItem('currentArticle', JSON.stringify(article))
      
      // Clean up URL by removing parameters
      window.history.replaceState({}, document.title, window.location.pathname)
      
      return
    }
    
    if (isViewMode) {
      // Load and display the stored article
      const storedArticle = localStorage.getItem('currentArticle')
      if (storedArticle) {
        try {
          this.currentArticle = JSON.parse(storedArticle)
          if (this.currentArticle) {
            this.contentDisplay.render(this.currentArticle)
            if (this.playButton) {
              this.playButton.disabled = false
            }
          }
        } catch (error) {
          console.error('Failed to load stored article:', error)
        }
      }
    }
  }
}

// Service Worker Registration
async function registerServiceWorker() {
  // Check if debug mode is enabled
  const urlParams = new URLSearchParams(window.location.search)
  const isDebugMode = urlParams.get('debug') === '1'

  // Show service worker status only in debug mode
  const statusContainer = document.getElementById('sw-status')
  if (isDebugMode && statusContainer) {
    statusContainer.style.display = 'block'
  }

  const statusEl = document.getElementById('sw-status-text')

  if ('serviceWorker' in navigator) {
    try {
      const isDev = import.meta.env.DEV
      statusEl!.textContent = isDev ? 'Registering (dev passthrough)...' : 'Registering...'
      if (isDev) {
        console.log('🧪 Dev mode: registering service worker (no caching except push/ingest)')
      }
      
      // First unregister any existing service worker
      const existingRegistrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of existingRegistrations) {
        console.log('🗑️ Unregistering old service worker:', registration.scope)
        await registration.unregister()
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js?v=' + Date.now(), {
        scope: '/'
      })
      console.log('✅ Service Worker registered successfully:', registration.scope)
      
      statusEl!.textContent = 'Registered, activating...'
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      console.log('✅ Service Worker is ready and active')
      
      // Check if it's controlling this page
      if (navigator.serviceWorker.controller) {
        statusEl!.textContent = '✅ Active and controlling page'
        statusEl!.style.color = 'green'
        console.log('🎯 Service Worker is controlling this page - bookmarklet should work!')
      } else {
        statusEl!.textContent = '⚠️ Active but not controlling page - refreshing...'
        statusEl!.style.color = 'orange'
        console.log('⚠️ Service Worker active but not controlling - triggering refresh')
        // Force a refresh to let the service worker take control
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        return
      }
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 New service worker version available')
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker installed, please refresh to update')
            }
          })
        }
      })
      
      // Force update if needed
      if (registration.waiting) {
        console.log('🔄 Service worker update pending')
      }
      
    } catch (error) {
      console.warn('❌ Service Worker registration failed:', error)
      statusEl!.textContent = '❌ Registration failed'
      statusEl!.style.color = 'red'
    }
  } else {
    console.warn('❌ Service Workers not supported in this browser')
    statusEl!.textContent = '❌ Not supported in this browser'
    statusEl!.style.color = 'red'
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MainApp()
  registerServiceWorker()
})

// Also register when page loads (backup)
window.addEventListener('load', () => {
  registerServiceWorker()
})
