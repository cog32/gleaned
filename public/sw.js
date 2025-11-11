// Gleaned Service Worker
const CACHE_NAME = 'gleaned-v2'
const STATIC_CACHE = 'gleaned-static-v2'
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

// Files to cache on install (minimal; HTML is cached on first visit at runtime)
const STATIC_FILES = [
  '/manifest.json',
  '/favicon.ico',
  '/vendor/Readability.js'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(STATIC_CACHE)
      console.log('📦 Service Worker: Caching static files (best-effort)')
      await Promise.all(
        STATIC_FILES.map(async (path) => {
          try {
            const req = new Request(path, { cache: 'reload' })
            const resp = await fetch(req)
            if (resp && resp.ok) {
              await cache.put(req, resp.clone())
            } else if (IS_DEV) {
              console.log('Service Worker: Skipped pre-cache (not OK)', path, resp?.status)
            }
          } catch (e) {
            if (IS_DEV) {
              console.log('Service Worker: Failed to pre-cache', path)
            }
          }
        })
      )
      console.log('✅ Service Worker: Installed successfully')
      await self.skipWaiting() // Force immediate activation
    } catch (error) {
      console.error('❌ Service Worker: Installation failed', error)
    }
  })())
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...')
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker: Activated and claiming clients')
        return self.clients.claim() // Take control immediately
      })
  )
})

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  console.log('🌐 Service Worker: Intercepted request', url.pathname, event.request.method, url.origin)

  // Handle CORS preflight requests
  if (event.request.method === 'OPTIONS') {
    event.respondWith(new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    }))
    return
  }

  // Handle the /push endpoint for content ingestion
  if (url.pathname === '/push' && event.request.method === 'POST') {
    console.log('📨 Service Worker: Handling /push request')
    event.respondWith(handleContentPush(event.request))
    return
  }

  // For navigation requests, let the browser handle them directly to avoid
  // returning redirected responses (e.g. pretty-URL rewrites).
  if (event.request.mode === 'navigate') {
    return
  }

  // In development, let all other requests hit the network directly to avoid
  // clashing with Vite's dev server / HMR assets.
  if (IS_DEV && url.origin === self.location.origin) {
    return
  }

  // Default caching strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response
        }

        // Fetch from network
        return fetch(event.request, { redirect: 'follow' })
          .then((response) => {
            // Don't cache non-successful responses or non-http schemes
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Don't cache chrome-extension or other non-http requests
            const url = new URL(event.request.url)
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
              return response
            }

            // Cache successful responses
            const responseToCache = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
              .catch((error) => {
                console.warn('Failed to cache response:', error)
              })

            return response
          })
      })
      .catch(() => {
        // Always return a Response to avoid TypeError in respondWith
        if (event.request.destination === 'document') {
          // Try cached index, else network index, else minimal offline page
          return caches.match('/index.html')
            .then((res) => res || fetch(new Request('/index.html', { redirect: 'follow' })))
            .catch(() => new Response('<!doctype html><title>Offline</title><h1>Offline</h1>', {
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            }))
        }
        // Non-document request fallback
        return new Response('', { status: 504 })
      })
  )
})

// Handle content push from bookmarklet
async function handleContentPush(request) {
  try {
    console.log('Service Worker: Handling content push request')
    const contentData = await request.json()
    console.log('Service Worker: Content data received', {
      hasHtml: !!contentData.html,
      url: contentData.url,
      title: contentData.title
    })

    // Validate required fields
    if (!contentData.html || !contentData.url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: html, url'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    // Store content in IndexedDB
    await storeIngestedContent({
      id: generateId(),
      url: contentData.url,
      title: contentData.title || extractTitleFromHTML(contentData.html),
      html: contentData.html,
      timestamp: Date.now(),
      source: 'bookmarklet'
    })

    console.log('Service Worker: Content stored successfully')

    // Return success response with redirect
    return new Response(JSON.stringify({
      success: true,
      redirectTo: '/ingest'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Service Worker: Content push failed', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
}

// Handle ingest page route safely: avoid recursion and redirected responses
async function handleIngestRedirect(request) {
  try {
    // 1) Prefer cached ingest page to avoid any redirects entirely
    const cached = await caches.match('/ingest.html')
    if (cached) {
      return cached
    }

    // 2) Fetch ingest.html directly (avoid requesting /ingest to prevent recursion)
    try {
      const resp = await fetch(new Request('/ingest.html', { cache: 'no-store', redirect: 'follow' }))
      if (resp && resp.ok && resp.type !== 'opaqueredirect' && !resp.redirected) {
        return resp
      }
      console.warn('Service Worker: Network ingest.html not usable', {
        status: resp?.status,
        redirected: resp?.redirected,
        type: resp?.type
      })
    } catch (e) {
      console.warn('Service Worker: Network fetch for ingest.html failed', e)
    }

    // 3) Final fallback: cached index
    const index = await caches.match('/index.html')
    if (index) return index

    // Last resort: attempt network index (should not recurse)
    return fetch(new Request('/index.html', { cache: 'no-store', redirect: 'follow' }))
  } catch (error) {
    console.error('Service Worker: Ingest route failed', error)
    // Final fallback: index
    return caches.match('/index.html')
  }
}

// IndexedDB operations
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GleanedDB', 1)

    request.onerror = () => {
      reject(request.error)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('ingestedContent')) {
        const store = db.createObjectStore('ingestedContent', { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('url', 'url', { unique: false })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      if (db.objectStoreNames.contains('ingestedContent')) {
        resolve(db)
        return
      }

      // If the store is missing, clear and recreate the database with the correct schema
      db.close()
      const deleteRequest = indexedDB.deleteDatabase('GleanedDB')
      deleteRequest.onerror = () => reject(deleteRequest.error)
      deleteRequest.onsuccess = () => {
        const recreateRequest = indexedDB.open('GleanedDB', 1)
        recreateRequest.onerror = () => reject(recreateRequest.error)
        recreateRequest.onupgradeneeded = () => {
          const upgradeDb = recreateRequest.result
          if (!upgradeDb.objectStoreNames.contains('ingestedContent')) {
            const store = upgradeDb.createObjectStore('ingestedContent', { keyPath: 'id' })
            store.createIndex('timestamp', 'timestamp', { unique: false })
            store.createIndex('url', 'url', { unique: false })
          }
        }
        recreateRequest.onsuccess = () => resolve(recreateRequest.result)
      }
    }
  })
}

async function storeIngestedContent(content) {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['ingestedContent'], 'readwrite')
    transaction.oncomplete = () => db.close()
    transaction.onabort = () => db.close()
    const store = transaction.objectStore('ingestedContent')

    const addRequest = store.add(content)
    addRequest.onsuccess = () => {
      resolve(content.id)
    }
    addRequest.onerror = () => {
      reject(addRequest.error)
    }
  })
}

async function getLatestIngestedContent() {
  const db = await openDatabase().catch(() => null)
  if (!db) {
    return null
  }

  if (!db.objectStoreNames.contains('ingestedContent')) {
    db.close()
    return null
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['ingestedContent'], 'readonly')
    transaction.oncomplete = () => db.close()
    transaction.onabort = () => db.close()
    const store = transaction.objectStore('ingestedContent')
    const index = store.index('timestamp')

    const cursorReq = index.openCursor(null, 'prev')
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result
      resolve(cursor ? cursor.value : null)
    }
    cursorReq.onerror = () => {
      reject(cursorReq.error)
    }
  })
}

// Utility functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function extractTitleFromHTML(html) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const title = doc.querySelector('title')?.textContent ||
      doc.querySelector('h1')?.textContent ||
      'Untitled Article'
    return title.trim()
  } catch (error) {
    return 'Untitled Article'
  }
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  const { type, payload } = event.data

  switch (type) {
    case 'GET_LATEST_CONTENT':
      getLatestIngestedContent()
        .then((content) => {
          event.ports[0].postMessage({ success: true, content })
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message })
        })
      break

    case 'CLEAR_INGESTED_CONTENT':
      clearIngestedContent(payload.id)
        .then(() => {
          event.ports[0].postMessage({ success: true })
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message })
        })
      break
  }
})

async function clearIngestedContent(id) {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['ingestedContent'], 'readwrite')
    transaction.oncomplete = () => db.close()
    transaction.onabort = () => db.close()
    const store = transaction.objectStore('ingestedContent')

    const deleteRequest = store.delete(id)
    deleteRequest.onsuccess = () => {
      resolve()
    }
    deleteRequest.onerror = () => {
      reject(deleteRequest.error)
    }
  })
}
