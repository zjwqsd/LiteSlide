import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  build: {
    lib: {
      // 指定入口文件
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LiteSlide',
      // 打包后的文件名
      fileName: (format) => `lite-slide.${format}.js`
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖 (比如 vue)
      // 这样使用你组件的人就不会加载两份 Vue 代码了
      external: ['vue'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})