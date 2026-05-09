import { defineConfig } from 'vite-plus'
import { cloudflare } from '@cloudflare/vite-plugin'

const base = process.env.VITE_BASE_URL || '/'
const baseDir = process.env.VITE_BASE_URL?.replace(/^\//, '').replace(/\/$/, '')
const outDir = baseDir ? `dist/${baseDir}` : 'dist'

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    singleQuote: true,
    semi: false,
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  base,
  build: {
    outDir,
  },
  plugins: [cloudflare()],
})
