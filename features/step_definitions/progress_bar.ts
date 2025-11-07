import { Given, When, Then } from '@cucumber/cucumber'
import { strict as assert } from 'node:assert'
import { ReadingService } from '../../src/services/reading.service.js'

const expect = (actual: any) => ({
  toBe: (expected: any) => assert.strictEqual(actual, expected),
  toBeDefined: () => assert.notStrictEqual(actual, undefined),
  toBeGreaterThan: (n: number) => assert.ok(actual > n),
  toBeGreaterThanOrEqual: (n: number) => assert.ok(actual >= n),
  toBeLessThanOrEqual: (n: number) => assert.ok(actual <= n)
})

let service: ReadingService

Given('I have a processed article with {int} words', function (count: number) {
  service = new ReadingService()
  // Inject words directly to avoid DOM dependency in this environment
  const fakeWords = Array.from({ length: count }, (_, i) => ({
    text: `word${i + 1}`,
    prefix: '',
    orp: 'w',
    suffix: '',
    displayTime: 200,
    isKeyTerm: false,
    isPunctuation: false,
    isFunctionWord: false,
    isImage: false
  }))
  ;(service as any)['words'] = fakeWords
  service.startSession('test-article')
  const progress = service.getProgress()
  expect(progress.totalWords).toBeGreaterThanOrEqual(count)
})

When('I seek to {int} percent on the progress bar', function (percent: number) {
  const total = service.getProgress().totalWords
  const index = Math.min(total - 1, Math.max(0, Math.round((percent / 100) * (total - 1))))
  service.jumpToWord(index)
  // Stash for later assertions
  ;(this as any).lastSeekIndex = index
})

Then('the current word index should be near {int}', function (expected: number) {
  const wordsRead = service.getProgress().wordsRead
  expect(Math.abs(wordsRead - expected)).toBeLessThanOrEqual(1)
})

Then('the current word index should be {int}', function (expected: number) {
  const wordsRead = service.getProgress().wordsRead
  expect(wordsRead).toBe(expected)
})

Given('reading is paused', function () {
  // Ensure paused state
  service.pause()
  const session: any = (service as any)['session']
  expect(session?.isPlaying).toBe(false)
})

Then('reading should remain paused', function () {
  const session: any = (service as any)['session']
  expect(session?.isPlaying).toBe(false)
})

Given('reading is playing', function () {
  // Avoid relying on window timers in this environment; set state directly
  const session: any = (service as any)['session']
  session.isPlaying = true
  expect(session?.isPlaying).toBe(true)
})

Then('reading should remain playing', function () {
  const session: any = (service as any)['session']
  expect(session?.isPlaying).toBe(true)
})
