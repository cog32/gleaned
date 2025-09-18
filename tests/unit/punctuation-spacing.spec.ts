import { describe, it, expect } from 'vitest'
import { ArticleExtractor } from '../../src/utils/article-extractor.js'
import { ContentCleaner } from '../../src/utils/content-cleaner.js'

function extractByArticleExtractor(input: string): string {
  // Feed HTML and use the innerText normalization path
  return ArticleExtractor.htmlToInnerText(`<div>${input}</div>`)
}

function extractByCleaner(input: string): string {
  // Cleaner works on HTML too
  return ContentCleaner.extractText(`<div>${input}</div>`)
}

describe('Punctuation spacing normalization', () => {
  const cases: Array<{ name: string; input: string; expected: string }> = [
    {
      name: 'simple full stop without space',
      input: 'Hello.World',
      expected: 'Hello. World',
    },
    {
      name: 'full stop followed by double quote and letter',
      input: 'He said."Next',
      expected: 'He said." Next',
    },
    {
      name: 'full stop followed by right curly quote and letter',
      input: 'He said.”Next',
      expected: 'He said.” Next',
    },
    {
      name: 'question mark followed by closing paren and letter',
      input: 'Really?)Next',
      expected: 'Really?) Next',
    },
    {
      name: 'ellipsis followed by letter',
      input: 'Wait…Next',
      expected: 'Wait… Next',
    },
    {
      name: 'acronym spacing is preserved/compacted',
      input: 'U. S. policy',
      expected: 'U.S. policy',
    },
    {
      name: 'does not over-space when already correct',
      input: 'Hello.  Next',
      expected: 'Hello. Next',
    },
  ]

  it('ArticleExtractor.htmlToInnerText inserts missing spaces after sentence punctuation', () => {
    for (const c of cases) {
      const out = extractByArticleExtractor(c.input)
      expect(out).toBe(c.expected)
    }
  })

  it('ContentCleaner.extractText inserts missing spaces after sentence punctuation', () => {
    for (const c of cases) {
      const out = extractByCleaner(c.input)
      expect(out).toBe(c.expected)
    }
  })
})

