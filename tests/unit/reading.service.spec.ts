import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ReadingService } from '../../src/services/reading.service.js'

describe('ReadingService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('processes text into words with content words present', () => {
    const svc = new ReadingService()
    const html = '<article><h1>Title</h1><p>This is a simple test of meaningful content with keywords and discovery happened.</p></article>'
    const words = svc.processText(html)

    const texts = words.map(w => w.text.toLowerCase())
    expect(texts).toContain('simple')
    expect(texts).toContain('meaningful')
    expect(texts).toContain('keywords')
    expect(texts).toContain('discovery')
  })

  it('does not skip function words in MVP playback', () => {
    const svc = new ReadingService()
    const html = '<p>The quick brown fox jumps over the lazy dog and a cat of mystery.</p>'
    svc.processText(html)

    // Ensure defaults (no skipping) regardless of speed
    svc.updateSettings({ skipFunctionWords: false, speed: 400 })

    const seen: string[] = []
    svc.setWordUpdateHandler((word) => {
      seen.push(word.text.toLowerCase())
    })

    svc.startSession('test-article')
    svc.play()

    // Advance enough time to read the sentence
    vi.advanceTimersByTime(8000)
    // Stop the session explicitly
    svc['pause']()

    // Normalize punctuation for assertions
    const clean = seen.map(w => w.replace(/[.,!?;:'"()\-]/g, ''))

    // Function words should be present in the emitted sequence
    expect(clean).toContain('the')
    expect(clean).toContain('over')
    expect(clean).toContain('and')
    expect(clean).toContain('a')
    expect(clean).toContain('of')
    // Content words should also be present
    expect(clean).toContain('quick')
    expect(clean).toContain('brown')
    expect(clean).toContain('mystery')
  })
})
