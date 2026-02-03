import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8002',  // 后端运行在8002端口
        changeOrigin: true,
        secure: false,                     // 允许不安全连接
        ws: true,                          // 支持WebSocket
        timeout: 300000,                   // 5分钟超时
        proxyTimeout: 300000,              // 代理超时
      }
    }
  }
})
