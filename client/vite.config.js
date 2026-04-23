import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 核心：相对路径base，本地双击index.html必须配置
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // 关闭sourcemap，减小包体积，避免构建冲突
    sourcemap: false,
    // 禁用压缩混淆，排查报错（排查通过后可改为 minify: 'esbuild'）
    minify: false,
    // 解决静态资源路径问题
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 手动分块，避免单文件过大
        manualChunks: undefined
      }
    }
  }
})