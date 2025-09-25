import { vi } from 'vitest'

// Mock Web Workers
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  terminate: vi.fn(),
  onerror: null,
  onmessage: null
}))

// Mock WebRTC
class MockRTCPeerConnection {
  static generateCertificate = vi.fn()

  createOffer = vi.fn()
  createAnswer = vi.fn()
  setLocalDescription = vi.fn()
  setRemoteDescription = vi.fn()
  addIceCandidate = vi.fn()
  createDataChannel = vi.fn()
  addEventListener = vi.fn()
  close = vi.fn()
}

global.RTCPeerConnection = MockRTCPeerConnection as any

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
  databases: vi.fn().mockResolvedValue([])
}

global.indexedDB = mockIndexedDB

// Mock Canvas and WebGL contexts
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return {
      clearColor: vi.fn(),
      clear: vi.fn(),
      drawArrays: vi.fn(),
      // Add other WebGL methods as needed
    }
  }
  if (contextType === '2d') {
    return {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      // Add other 2D context methods as needed
    }
  }
  return null
})

// Mock AudioContext
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  createAnalyser: vi.fn(),
  close: vi.fn()
}))

// Mock gamepad API
global.navigator.getGamepads = vi.fn(() => [])

// Setup DOM environment for Phaser
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16)
  return 1
})

global.cancelAnimationFrame = vi.fn()

// Console warning suppression for tests
const originalWarn = console.warn
console.warn = (...args) => {
  // Suppress specific warnings that are expected in test environment
  const message = args.join(' ')
  if (
    message.includes('WebGL') ||
    message.includes('AudioContext') ||
    message.includes('Worker')
  ) {
    return
  }
  originalWarn.apply(console, args)
}