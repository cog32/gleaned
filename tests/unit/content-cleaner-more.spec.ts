import { describe, it, expect } from 'vitest'
import { ContentCleaner } from '../../src/utils/content-cleaner.js'

describe('ContentCleaner helpers', () => {
  it('countWords and estimateReadingTime', () => {
    const text = 'one two three four five'
    expect(ContentCleaner.countWords(text)).toBe(5)
    expect(ContentCleaner.estimateReadingTime(500, 250)).toBe(2)
    expect(ContentCleaner.estimateReadingTime(249, 250)).toBe(1)
  })
})

