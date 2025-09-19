import { Given, When, Then } from '@cucumber/cucumber'

// Mock DOM and localStorage for testing
let mockStorage: { [key: string]: string } = {}
let mockLocation = { href: 'http://localhost/' }

// Mock localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value },
    removeItem: (key: string) => { delete mockStorage[key] },
    clear: () => { mockStorage = {} }
  },
  writable: true
})

// Mock window.location
Object.defineProperty(global, 'location', {
  value: mockLocation,
  writable: true
})

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    getElementById: (id: string) => ({ 
      style: {}, 
      innerHTML: '', 
      textContent: '',
      disabled: false,
      addEventListener: () => {},
      click: () => {}
    }),
    body: { innerHTML: '' },
    createElement: (tag: string) => ({
      innerHTML: '',
      textContent: '',
      style: {},
      appendChild: () => {}
    })
  },
  writable: true
})

// Clean up before each scenario
Given('I clear all stored data', function () {
  mockStorage = {}
  mockLocation.href = 'http://localhost/'
})

Given('I am on the main page', function () {
  mockLocation.href = 'http://localhost/index.html'
})

Given('I am on the reading page', function () {
  mockLocation.href = 'http://localhost/reading.html'
})
