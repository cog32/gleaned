// Gleaned Service Worker
const CACHE_NAME = 'gleaned-v1'
const STATIC_CACHE = 'gleaned-static-v1'
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/index.html',
  '/reading.html',
  '/ingest.html',
  '/manifest.json'
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('✅ Service Worker: Installed successfully')
        return self.skipWaiting() // Force immediate activation
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error)
      })
  )
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

  // Handle the /ingest endpoint
  if (url.pathname === '/ingest') {
    event.respondWith(handleIngestRedirect(event.request))
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
        return fetch(event.request)
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
        // Return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/index.html')
        }
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

// Handle ingest page route: always serve ingest.html; client will fetch content
async function handleIngestRedirect(request) {
  try {
    // Prefer cached ingest page
    const cached = await caches.match('/ingest.html')
    if (cached) return cached
    // Fallback to network fetch
    return fetch('/ingest.html')
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
