import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import styleImport from 'vite-plugin-style-import'
// import ViteComponents, { AntDesignVueResolver } from 'vite-plugin-components'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    },
    include: ['@mq/fsm'],
    force: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/, /lib/, /ethereumjs-util/]
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // ...
        }
      }
    }),
    Components({
      resolvers: [AntDesignVueResolver()]
    }),
    styleImport({
      libs: [
        {
          libraryName: 'ant-design-vue',
          esModule: true,
          resolveStyle: (name) => {
            return `ant-design-vue/es/${name}/style/css`
          }
        }
      ]
    })
  ],
  resolve: {
    alias: {
      "protobufjs": "protobufjs/dist/protobuf.min.js",
      '@': path.resolve(_dirname, 'src'),
    }
  },
  server: {
    fs: {
      strict: false
    },
    host: '0.0.0.0'
  }
})
