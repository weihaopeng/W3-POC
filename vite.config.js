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
  base: '', // important, do not generate static absolute path, not working for ipfs
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    },
    include: ['@mq/fsm', '@chainsafe/libp2p-gossipsub'],
    force: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/, /lib/, /ethereumjs-util/, /libp2p-gossipsub/]
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
      /**
       * When vite compiles, directly use the `protobufjs` package file to bundle, there will be an exception in the order of dependent functions inside the package.
       * We need to use the min file in this package directly instead. But in another library there is a file using `protobufjs/minimal`,
       * the vite will find the file in the root directory of the project. So we need to add the first line to keep it as it is.
       */
      "protobufjs/minimal": "protobufjs/minimal",
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
