import { describe, it, expect } from 'vitest'
import { ReadingService } from '../../src/services/reading.service.js'

describe('ReadingService extra coverage', () => {
  it('resolves image URLs against base URL and keeps data URLs', () => {
    const svc = new ReadingService()
    const html = '<p>X</p><img src="/img.png" alt="A"><img src="data:image/png;base64,abc" alt="B"><img src="::::" alt="C">'
    const words = svc.processText(html, 'https://example.com/path/page')
    const imgs = words.filter(w => w.isImage)
    expect(imgs.length).toBe(3)
    expect(imgs[0].imageSrc).toBe('https://example.com/img.png')
    expect(imgs[1].imageSrc?.startsWith('data:image/png')).toBe(true)
    // Non-standard path resolves relative to base URL
    expect(imgs[2].imageSrc).toBe('https://example.com/path/::::')
  })

  it('processWord ORP segmentation covers different length branches', () => {
    const svc = new ReadingService()
    const pw = (svc as any).processWord.bind(svc)
    const zero = pw('')
    expect(zero.orp).toBe('')
    const short = pw('a')
    expect(short.orp.length).toBe(1)
    const mid = pw('word')
    expect(mid.orp.length).toBe(1)
    const long = pw('longword')
    expect(long.prefix.length).toBeGreaterThanOrEqual(2)
  })

  it('getProgress returns zeros without a session', () => {
    const svc = new ReadingService()
    const p = svc.getProgress()
    expect(p.totalWords).toBe(0)
    expect(p.percentComplete).toBe(0)
  })

  it('startSession throws if no words were processed', () => {
    const svc = new ReadingService()
    expect(() => svc.startSession('x')).toThrowError()
  })

  it('jumpTo and replaySentence adjust indices correctly', () => {
    const svc = new ReadingService()
    // Seed words manually to avoid DOM dependency
    ;(svc as any)['words'] = [
      { text: 'Hello', prefix: 'H', orp: 'e', suffix: 'llo', displayTime: 100, isKeyTerm: false, isPunctuation: false, isFunctionWord: false, isImage: false },
      { text: ',', prefix: '', orp: ',', suffix: '', displayTime: 100, isKeyTerm: false, isPunctuation: true, isFunctionWord: false, isImage: false },
      { text: 'world', prefix: 'w', orp: 'o', suffix: 'rld', displayTime: 100, isKeyTerm: false, isPunctuation: false, isFunctionWord: false, isImage: false },
      { text: '.', prefix: '', orp: '.', suffix: '', displayTime: 100, isKeyTerm: false, isPunctuation: true, isFunctionWord: false, isImage: false },
      { text: 'Next', prefix: 'N', orp: 'e', suffix: 'xt', displayTime: 100, isKeyTerm: false, isPunctuation: false, isFunctionWord: false, isImage: false },
    ]
    svc.startSession('art')
    // Jump to end
    svc.jumpToEnd()
    expect((svc as any)['session'].currentWordIndex).toBe(4)
    // Go to word 4 (after a sentence) then replay sentence should seek to index after last punctuation (which is 4 after ".")
    ;(svc as any)['session'].currentWordIndex = 4
    svc.replaySentence()
    expect((svc as any)['session'].currentWordIndex).toBe(4)
    // Move into middle of sentence and replay
    ;(svc as any)['session'].currentWordIndex = 2
    svc.replaySentence()
    expect((svc as any)['session'].currentWordIndex).toBe(2)
    // Jump to start
    svc.jumpToStart()
    expect((svc as any)['session'].currentWordIndex).toBe(0)
  })
})
