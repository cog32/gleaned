// Development server with bookmarklet API support
import express from 'express'
import bodyParser from 'body-parser'
import { createServer as createViteServer } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function createServer() {
  const app = express()

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  })

  // Parse JSON bodies
  app.use(bodyParser.json({ limit: '10mb' }))

  // CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.sendStatus(200)
      return
    }
    next()
  })

  // Bookmarklet content ingestion endpoint
  app.post('/push', (req, res) => {
    console.log('📖 Bookmarklet content received:', {
      hasHtml: !!req.body.html,
      url: req.body.url,
      title: req.body.title,
      contentLength: req.body.html?.length || 0
    })

    try {
      // Validate required fields
      if (!req.body.html || !req.body.url) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: html, url'
        })
      }

      // Store in temporary storage (in a real app, this would be a database)
      global.tempContent = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        url: req.body.url,
        title: req.body.title || 'Untitled Article',
        html: req.body.html,
        author: req.body.author,
        timestamp: Date.now(),
        source: 'bookmarklet'
      }

      console.log('✅ Content stored successfully, redirecting to ingest page')

      res.json({
        success: true,
        redirectTo: '/ingest'
      })

    } catch (error) {
      console.error('❌ Content push failed:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // API endpoint to get latest content for ingest page
  app.get('/api/latest-content', (req, res) => {
    if (global.tempContent) {
      res.json({ success: true, content: global.tempContent })
      // Clear after retrieval
      delete global.tempContent
    } else {
      res.json({ success: false, content: null })
    }
  })

  // Use Vite's connect instance as middleware
  app.use(vite.ssrFixStacktrace)
  app.use(vite.middlewares)

  const port = 3000
  app.listen(port, () => {
    console.log(`🚀 Gleaned dev server running at http://localhost:${port}`)
    console.log(`📖 Bookmarklet endpoint ready at http://localhost:${port}/push`)
  })
}

createServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})