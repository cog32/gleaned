import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const footerHtml = `
<footer id=\"support-footer\" style=\"margin-top: 0; padding: 0.5rem 1rem; text-align: center; border-top: 1px solid #e0e0e0;\">
  <p style=\"margin: 0; color: #666; font-size: 0.9rem;\">
    Enjoying Gleaned?
    <a id=\"buy-me-coffee-link\" href=\"https://buymeacoffee.com/cog32\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: #007bff; text-decoration: none;\">☕ Buy me a coffee</a>
    <span aria-hidden=\"true\"> · </span>
    <a id=\"github-link\" href=\"https://github.com/cog32/gleaned\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color: inherit; text-decoration: none; margin-left: 0.25rem; display: inline-flex; align-items: center; gap: 0.35rem;\" aria-label=\"View on GitHub\">
      <svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"currentColor\" aria-hidden=\"true\" focusable=\"false\">
        <path fill-rule=\"evenodd\" d=\"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.11 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.91.08 2.11.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z\"></path>
      </svg>
      <span>GitHub</span>
    </a>
  </p>
</footer>
`

export default defineConfig({
  plugins: [
    createHtmlPlugin({
      minify: true,
      pages: [
        {
          filename: 'index.html',
          template: 'index.html',
          injectOptions: {
            data: { footer: footerHtml },
          },
        },
        {
          filename: 'reading.html',
          template: 'reading.html',
          injectOptions: {
            data: { footer: footerHtml },
          },
        },
        {
          filename: 'ingest.html',
          template: 'ingest.html',
          injectOptions: {
            data: { footer: footerHtml },
          },
        },
        {
          filename: 'bridge/index.html',
          template: 'bridge/bridge.html',
          injectOptions: {
            data: { footer: '' },
          },
        },
      ],
    }),
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
        bridge: 'bridge/bridge.html'
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
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
