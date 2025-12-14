import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const srcDir = path.resolve(__dirname, 'src')
const clientMock = path.resolve(srcDir, '__mocks__/@robosystems/client.js')
const clientExtensionsMock = path.resolve(
  srcDir,
  '__mocks__/@robosystems/client-extensions.js'
)
const reactMarkdownMock = path.resolve(srcDir, '__mocks__/react-markdown.js')

export default defineConfig({
  plugins: [react()],
  server: {
    deps: {
      inline: [
        /^(remark|rehype|unist|mdast|hast|unified|bail|is-plain-obj|trough|vfile|vfile-message|property-information|space-separated-tokens|comma-separated-tokens|web-namespaces|zwitch|html-void-elements|ccount|escape-string-regexp|markdown-table)/,
      ],
    },
  },
  resolve: {
    alias: {
      '@': srcDir,
      'react-markdown': reactMarkdownMock,
      '@robosystems/client/extensions': clientExtensionsMock,
      '@robosystems/client': clientMock,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['**/__tests__/**/*.test.{ts,tsx,js,jsx}'],
    silent: true,
    reporters: 'default',
    threads: false,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
})
