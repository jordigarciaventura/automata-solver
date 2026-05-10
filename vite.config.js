import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist'
  },
  plugins: [
    cloudflare()
  ]
})