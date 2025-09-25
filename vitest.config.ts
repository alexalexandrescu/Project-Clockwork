import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/core': path.resolve(__dirname, 'src/core'),
      '@/workers': path.resolve(__dirname, 'src/workers'),
      '@/game': path.resolve(__dirname, 'src/game'),
      '@/systems': path.resolve(__dirname, 'src/systems'),
      '@/ui': path.resolve(__dirname, 'src/ui'),
      '@/assets': path.resolve(__dirname, 'src/assets'),
      '@/types': path.resolve(__dirname, 'src/types')
    }
  }
})