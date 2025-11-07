import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RSVPDisplayComponent } from '../../src/components/rsvp-display.js'

function setup() {
  document.body.innerHTML = '<div id="root"></div>'
  const root = document.getElementById('root') as HTMLElement
  const comp = new RSVPDisplayComponent(root)
  return { root, comp }
}

describe('RSVPDisplayComponent', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useRealTimers()
  })

  it('renders a word with ORP highlighting and classes', () => {
    const { comp, root } = setup()
    comp.displayWord({
      text: 'reading',
      prefix: 'read',
      orp: 'i',
      suffix: 'ng',
      displayTime: 120,
      isKeyTerm: true,
      isFunctionWord: true,
      isPunctuation: false,
      isImage: false,
    }, true, true)

    const current = root.querySelector('#current-word') as HTMLElement
    expect(current).toBeTruthy()
    expect(current.className).toContain('current-word')
    expect(current.className).toContain('key-term')
    expect(current.className).toContain('function-word')
    expect((current.querySelector('.orp') as HTMLElement).textContent).toBe('i')
  })

  it('renders punctuation class when punctuation word is displayed', () => {
    const { comp, root } = setup()
    comp.displayWord({
      text: 'x.',
      prefix: 'x',
      orp: '.',
      suffix: '',
      displayTime: 80,
      isKeyTerm: false,
      isFunctionWord: false,
      isPunctuation: true,
      isImage: false,
    }, true, false)
    const current = root.querySelector('#current-word') as HTMLElement
    expect(current.className).toContain('punctuation')
  })

  it('renders image tokens with <img> and image class', () => {
    const { comp, root } = setup()
    comp.displayWord({
      text: '[img]',
      prefix: '',
      orp: '',
      suffix: '',
      displayTime: 500,
      isKeyTerm: false,
      isFunctionWord: false,
      isPunctuation: false,
      isImage: true,
      imageSrc: 'https://example.com/x.png',
      imageAlt: 'example',
    })
    const current = root.querySelector('#current-word') as HTMLElement
    expect(current.className).toContain('image')
    const img = current.querySelector('img.image-word') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('https://example.com/x.png')
  })

  it('showPause and showComplete update classes and text', async () => {
    const { comp, root } = setup()
    comp.showPause('Paused')
    const paused = root.querySelector('#current-word') as HTMLElement
    expect(paused.className).toContain('paused')
    expect(paused.textContent || '').toContain('Paused')

    vi.useFakeTimers()
    comp.showComplete()
    const completed = root.querySelector('#current-word') as HTMLElement
    expect(completed.className).toContain('completed')
    vi.advanceTimersByTime(200)
    expect(completed.className).toContain('completion-effect')
    vi.useRealTimers()
  })

  it('updateDisplaySize sets font-size based on rsvp container width', () => {
    const { comp, root } = setup()
    const rsvp = root.querySelector('.rsvp-display') as HTMLElement
    const current = root.querySelector('#current-word') as HTMLElement
    const getter = vi.spyOn(rsvp, 'clientWidth', 'get')
    getter.mockReturnValueOnce(350)
    comp.updateDisplaySize()
    expect(current.style.fontSize).toBe('24px')

    getter.mockReturnValueOnce(700)
    comp.updateDisplaySize()
    expect(current.style.fontSize).toBe('32px')

    getter.mockReturnValue(900)
    comp.updateDisplaySize()
    expect(current.style.fontSize).toBe('42px')
  })

  it('context display can be toggled', () => {
    const { comp, root } = setup()
    comp.enableContextDisplay(['a', 'b', 'c'], ['d', 'e', 'f'])
    const ctx = root.querySelector('.context-display') as HTMLElement
    expect(ctx.style.display).toBe('block')
    comp.disableContextDisplay()
    expect(ctx.style.display).toBe('none')
  })
})
