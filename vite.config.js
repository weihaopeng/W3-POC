import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  root: 'src',
  server: {
    host: '0.0.0.0'
  }
  // build: {
  //   rollupOptions: {
  //     input: {
  //       index: new URL( './src/w3.poc.html', import.meta.url).pathname,
  //     }
  //   }
  // }
})
