import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 3000,
    watch: {
      ignored: ['**/content/**'],
    },
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart({
      router: {
        generatedRouteTree: 'src/routeTree.gen.ts',
        autoCodeSplitting: true,
      },
    }),
    viteReact(),
  ],
})
