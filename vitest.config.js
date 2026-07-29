import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src/renderer'),
      '@shared': path.resolve(rootDir, 'src/shared')
    }
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/renderer/**', 'happy-dom']
    ],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: [
        'src/shared/utils/**/*.js',
        'src/main/utils/**/*.js',
        'src/main/configs/**/*.js',
        'src/renderer/components/**/*.vue'
      ],
      reporter: ['text', 'lcov']
    }
  }
})
