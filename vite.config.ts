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
        target: 'http://localhost:8000',  // 使用localhost而非127.0.0.1以兼容VPN
        changeOrigin: true,
        secure: false,                     // 允许不安全连接
        ws: true,                          // 支持WebSocket
        timeout: 300000,                   // 5分钟超时
        proxyTimeout: 300000,              // 代理超时
      }
    }
  }
})
