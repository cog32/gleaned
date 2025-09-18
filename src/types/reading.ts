export interface RSVPWord {
  text: string
  prefix: string
  orp: string
  suffix: string
  displayTime: number
  isKeyTerm: boolean
  isPunctuation: boolean
  isFunctionWord: boolean
  isImage: boolean
  imageSrc?: string
  imageAlt?: string
}

export interface ReadingSession {
  articleId: string
  startTime: number
  currentWordIndex: number
  totalWords: number
  speed: number // WPM
  isPlaying: boolean
  isPaused: boolean
  sessionDuration: number // ms
}

export interface ReadingProgress {
  wordsRead: number
  totalWords: number
  percentComplete: number
  timeElapsed: number
  timeRemaining: number
  currentParagraph: number
  totalParagraphs: number
}

export interface RSVPSettings {
  speed: number // WPM
  pauseAtSentences: boolean
  pauseAtParagraphs: boolean
  skipFunctionWords: boolean
  highlightKeyTerms: boolean
  orpEnabled: boolean
  sessionTimeLimit: number // minutes
}
