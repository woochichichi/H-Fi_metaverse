import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'version-stamp',
      buildStart() {
        writeFileSync('public/version.json', JSON.stringify({ v: Date.now() }))
      },
    },
  ],
})
