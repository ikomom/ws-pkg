import { resolve } from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    Vue({
      reactivityTransform: true,
    }),
    UnoCSS({
      configFile: resolve(__dirname, 'unocss.config.ts'),
    }),
    Components({
      dts: './src/components.d.ts',
    }),
    AutoImport({
      imports: [
        'vue',
        'vue/macros',
        '@vueuse/core',
      ],
      dts: './src/auto-imports.d.ts',
    }),
  ],
  // build: {
  //   rollupOptions: {
  //     external: [
  //       'local-pkg',
  //       'fs',
  //     ],
  //     input: [
  //       './index.html',
  //     ],
  //   },
  // },
})
