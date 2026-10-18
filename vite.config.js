import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // مسارات نسبية حتى يعمل الموقع من أي رابط (مثل GitHub Pages)
  base: './',
})
