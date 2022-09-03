import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  root: 'src',
  // build: {
  //   rollupOptions: {
  //     input: {
  //       index: new URL( './src/w3.poc.html', import.meta.url).pathname,
  //     }
  //   }
  // }
})
