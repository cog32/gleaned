import { describe, it, expect, vi } from 'vitest'
import { ArticleExtractor } from '../../src/utils/article-extractor.js'

describe('ArticleExtractor loader', () => {
  it('ensureReadabilityLoaded returns false when scripts fail', async () => {
    const spy = vi.spyOn(ArticleExtractor as any, 'loadScript').mockResolvedValue(false)
    const ok = await (ArticleExtractor as any).ensureReadabilityLoaded()
    expect(ok).toBe(false)
    spy.mockRestore()
  })
})

