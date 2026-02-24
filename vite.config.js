import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 手动加载 .env.local 到 process.env（供 API handler 使用）
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    })
  }
}
loadEnvFile()

// 本地开发 API 插件：在 Vite 开发服务器中模拟 Vercel Serverless Functions
function apiDevPlugin() {
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        try {
          // 解析 POST 请求体
          let body = {}
          if (req.method === 'POST') {
            body = await new Promise((resolve) => {
              let data = ''
              req.on('data', (chunk) => { data += chunk })
              req.on('end', () => {
                try { resolve(JSON.parse(data || '{}')) }
                catch { resolve({}) }
              })
            })
          }

          // 路由匹配
          const url = new URL(req.url, 'http://localhost')
          let handlerPath = ''
          const query = Object.fromEntries(url.searchParams)

          if (url.pathname === '/api/room/create') {
            handlerPath = path.resolve(__dirname, 'api/room/create.js')
          } else if (url.pathname === '/api/room/message') {
            handlerPath = path.resolve(__dirname, 'api/room/message.js')
          } else if (url.pathname === '/api/room/delete-message') {
            handlerPath = path.resolve(__dirname, 'api/room/delete-message.js')
          } else if (url.pathname === '/api/upload/token') {
            handlerPath = path.resolve(__dirname, 'api/upload/token.js')
          } else if (url.pathname.match(/^\/api\/room\/([A-Za-z0-9]+)$/)) {
            const id = url.pathname.split('/').pop()
            query.id = id
            handlerPath = path.resolve(__dirname, 'api/room/[id].js')
          } else {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'API 路由未找到' }))
            return
          }

          // 动态导入 handler
          const mod = await import(`${handlerPath}?t=${Date.now()}`)
          const handler = mod.default

          // 构造 mock req/res 对象
          const mockReq = { method: req.method, headers: req.headers, query, body, url: req.url }
          const mockRes = {
            statusCode: 200,
            _headers: {},
            setHeader(k, v) { this._headers[k] = v },
            status(code) { this.statusCode = code; return this },
            json(data) {
              res.statusCode = this.statusCode
              Object.entries(this._headers).forEach(([k, v]) => res.setHeader(k, v))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            },
            end(data) {
              res.statusCode = this.statusCode
              Object.entries(this._headers).forEach(([k, v]) => res.setHeader(k, v))
              res.end(data)
            },
          }

          await handler(mockReq, mockRes)
        } catch (err) {
          console.error('API 开发服务器错误:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: '服务器内部错误: ' + err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
})
