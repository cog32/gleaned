import { RSVPDisplayComponent } from '../../src/components/rsvp-display'
import type { RSVPWord } from '../../src/types/reading'

describe('Image Display Features', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders an inline image when RSVPWord.isImage with imageSrc', () => {
    // Arrange container and component
    const container = document.createElement('div')
    document.body.appendChild(container)
    const component = new RSVPDisplayComponent(container)

    const imageWord: RSVPWord = {
      text: '[image] ',
      prefix: '',
      orp: '',
      suffix: '',
      displayTime: 600,
      isKeyTerm: false,
      isPunctuation: false,
      isFunctionWord: false,
      isImage: true,
      imageSrc: 'https://example.com/test.png',
      imageAlt: 'Test Image',
    }

    // Act
    component.displayWord(imageWord)

    // Assert
    const currentWord = container.querySelector('#current-word') as HTMLElement
    expect(currentWord).toBeTruthy()
    expect(currentWord.classList.contains('image')).toBe(true)

    const img = currentWord.querySelector('img.image-word') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.src).toContain('https://example.com/test.png')
    expect(img.alt).toBe('Test Image')

    const wordLength = container.querySelector('#word-length') as HTMLElement
    const wordType = container.querySelector('#word-type') as HTMLElement
    expect(wordLength.textContent).toBe('—')
    expect(wordType.textContent).toBe('Image')
  })

  it('renders a fallback indicator when RSVPWord.isImage without imageSrc', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const component = new RSVPDisplayComponent(container)

    const imageWordNoSrc: RSVPWord = {
      text: '[image] ',
      prefix: '',
      orp: '',
      suffix: '',
      displayTime: 600,
      isKeyTerm: false,
      isPunctuation: false,
      isFunctionWord: false,
      isImage: true,
      imageAlt: 'Diagram',
    }

    component.displayWord(imageWordNoSrc)

    const currentWord = container.querySelector('#current-word') as HTMLElement
    expect(currentWord).toBeTruthy()
    expect(currentWord.classList.contains('image')).toBe(true)

    const indicator = currentWord.querySelector('span.image-indicator') as HTMLSpanElement
    expect(indicator).toBeTruthy()
    expect(indicator.textContent).toContain('Diagram')

    const wordLength = container.querySelector('#word-length') as HTMLElement
    const wordType = container.querySelector('#word-type') as HTMLElement
    expect(wordLength.textContent).toBe('—')
    expect(wordType.textContent).toBe('Image')
  })

  it('defaults alt text to "Image" when imageAlt is empty', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const component = new RSVPDisplayComponent(container)

    const imageWordEmptyAlt: RSVPWord = {
      text: '[image] ',
      prefix: '',
      orp: '',
      suffix: '',
      displayTime: 600,
      isKeyTerm: false,
      isPunctuation: false,
      isFunctionWord: false,
      isImage: true,
      imageSrc: 'https://example.com/empty-alt.png',
      imageAlt: '   ',
    }

    component.displayWord(imageWordEmptyAlt)

    const img = container.querySelector('#current-word img.image-word') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.alt).toBe('Image')
  })

  it('recovers to text rendering after showing an image', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const component = new RSVPDisplayComponent(container)

    // First display an image
    const imageWord: RSVPWord = {
      text: '[image] ',
      prefix: '',
      orp: '',
      suffix: '',
      displayTime: 600,
      isKeyTerm: false,
      isPunctuation: false,
      isFunctionWord: false,
      isImage: true,
      imageSrc: 'https://example.com/pic.png',
      imageAlt: 'Pic',
    }
    component.displayWord(imageWord)

    const currentWord1 = container.querySelector('#current-word') as HTMLElement
    expect(currentWord1.querySelector('img.image-word')).toBeTruthy()
    expect(currentWord1.className).toContain('image')

    // Then display a normal word; component should restore span structure
    const normalWord: RSVPWord = {
      text: 'word',
      prefix: 'wo',
      orp: 'r',
      suffix: 'd',
      displayTime: 240,
      isKeyTerm: false,
      isPunctuation: false,
      isFunctionWord: false,
      isImage: false,
    }
    component.displayWord(normalWord)

    const currentWord2 = container.querySelector('#current-word') as HTMLElement
    expect(currentWord2.querySelector('img.image-word')).toBeNull()
    expect(currentWord2.className).toBe('current-word')

    const prefix = currentWord2.querySelector('.word-prefix') as HTMLElement
    const orp = currentWord2.querySelector('.orp') as HTMLElement
    const suffix = currentWord2.querySelector('.word-suffix') as HTMLElement
    expect(prefix.textContent).toBe('wo')
    expect(orp.textContent).toBe('r')
    expect(suffix.textContent).toBe('d')

    const wordLength = container.querySelector('#word-length') as HTMLElement
    const wordType = container.querySelector('#word-type') as HTMLElement
    expect(wordLength.textContent).toBe('4 chars')
    expect(wordType.textContent).toBe('Regular')
  })
})
