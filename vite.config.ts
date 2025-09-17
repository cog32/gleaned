import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'gleaned-push-endpoint',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Handle POST /push for bookmarklet content ingestion
          if (req.url === '/push' && req.method === 'OPTIONS') {
            // CORS preflight
            res.statusCode = 200
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.end()
            return
          }

          if (req.url === '/push' && req.method === 'POST') {
            let data = ''
            req.on('data', (chunk) => {
              data += chunk
            })
            req.on('end', () => {
              try {
                const body = JSON.parse(data || '{}')

                if (!body.html || !body.url) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.setHeader('Access-Control-Allow-Origin', '*')
                  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
                  res.end(JSON.stringify({ success: false, error: 'Missing required fields: html, url' }))
                  return
                }

                // Temporary in-memory store for ingest page
                ; (globalThis as any).tempContent = {
                  id: Date.now().toString(36) + Math.random().toString(36).slice(2),
                  url: body.url,
                  title: body.title || 'Untitled Article',
                  html: body.html,
                  author: body.author,
                  timestamp: Date.now(),
                  source: 'bookmarklet'
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
                res.end(JSON.stringify({ success: true, redirectTo: '/ingest' }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.setHeader('Access-Control-Allow-Origin', '*')
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
                res.end(JSON.stringify({ success: false, error: err?.message || 'Unknown error' }))
              }
            })
            return
          }

          // Handle GET /api/latest-content for ingest page
          if (req.url === '/api/latest-content' && req.method === 'GET') {
            const temp = (globalThis as any).tempContent
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            if (temp) {
              // Return and clear
              delete (globalThis as any).tempContent
              res.end(JSON.stringify({ success: true, content: temp }))
            } else {
              res.end(JSON.stringify({ success: false, content: null }))
            }
            return
          }

          next()
        })
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        reading: 'reading.html',
        ingest: 'ingest.html',
        bridge: 'bridge/index.html'
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    cors: true,
    middlewareMode: false,
    // Add middleware to handle /push endpoint
    proxy: {},
    fs: {
      // Allow serving files from anywhere for bookmarklet functionality
      allow: ['..']
    }
  },
  define: {
    // Help with debugging
    'process.env.NODE_ENV': '"development"'
  }
})
