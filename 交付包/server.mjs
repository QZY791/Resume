#!/usr/bin/env node
/**
 * 个人简历素材库 · 本地静态服务器
 * ---------------------------------------------------------------
 * 零依赖，只用 Node 内置模块。
 *
 * 为什么需要它：
 *   本项目是单页应用（history 路由）+ IndexedDB 本地持久化。
 *   直接双击 index.html 用 file:// 打开会出两个问题：
 *     1) 路由路径（如 /experiences）在 file:// 下无法回退，刷新即 404；
 *     2) 部分浏览器在 file:// 下禁用 IndexedDB，数据存不进去。
 *   所以用一个本地小服务器把 www/ 提供出来，是最稳的用法。
 *
 * 只监听 127.0.0.1，不对外网开放。
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(HERE, 'www')
const HOST = '127.0.0.1'

/**
 * 起始端口 8888。
 * 不用 4321 / 4173 这类端口：Windows 上 Hyper-V / WSL 会保留成片的 TCP 端口段
 * （用 `netsh interface ipv4 show excludedportrange protocol=tcp` 可查），
 * 落在保留段里 bind 会直接报 EACCES 而不是 EADDRINUSE。
 */
const START_PORT = 8888
const MAX_TRIES = 30

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error('')
  console.error('  [错误] 找不到 www/index.html，交付包可能不完整。')
  console.error('')
  process.exit(1)
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(body)
}

const server = createServer((req, res) => {
  let urlPath
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    return send(res, 400, 'Bad Request')
  }

  // 防目录穿越：拼接并归一化后，必须仍落在 ROOT 之内
  let filePath = resolve(ROOT, '.' + normalize(urlPath))
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
    return send(res, 403, 'Forbidden')
  }

  let isFile = false
  try {
    isFile = statSync(filePath).isFile()
  } catch {
    isFile = false
  }

  // 请求的是目录 → 取该目录下的 index.html
  if (!isFile) {
    const asDir = join(filePath, 'index.html')
    if (existsSync(asDir)) {
      filePath = asDir
      isFile = true
    }
  }

  // 单页应用回退：没有扩展名的路径一律交给前端路由接管
  if (!isFile) {
    if (extname(urlPath)) return send(res, 404, 'Not Found')
    filePath = join(ROOT, 'index.html')
  }

  res.writeHead(200, {
    'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  })
  createReadStream(filePath).pipe(res)
})

let port = START_PORT
let tries = 0

server.on('error', (err) => {
  // EADDRINUSE：端口被别的程序占了
  // EACCES    ：端口落在系统保留段里（Hyper-V / WSL 常见），换个端口就好
  const retryable = err.code === 'EADDRINUSE' || err.code === 'EACCES'

  if (retryable && tries < MAX_TRIES) {
    tries++
    port++
    server.listen(port, HOST)
    return
  }

  if (retryable) {
    // 连续 N 个端口都不行，交给系统随机分配一个真正可用的端口
    port = 0
    server.listen(port, HOST)
    return
  }

  console.error('')
  console.error('  [错误] 启动失败：' + err.message)
  console.error('')
  process.exit(1)
})

server.on('listening', () => {
  // listen(0) 时由系统分配，实际端口要从 address() 取
  const actual = server.address()
  const realPort = typeof actual === 'object' && actual ? actual.port : port
  const url = `http://${HOST}:${realPort}/`
  console.log('')
  console.log('  个人简历素材库  已启动')
  console.log('  ────────────────────────────────────────')
  console.log('  访问地址：' + url)
  if (realPort !== START_PORT) {
    console.log('  （默认端口 ' + START_PORT + ' 不可用，已自动改用 ' + realPort + '）')
  }
  console.log('  数据存放：本机浏览器（IndexedDB），不上传任何服务器')
  console.log('  关闭方式：关掉这个窗口，或按 Ctrl + C')
  console.log('')
  console.log('  提示：换浏览器 / 清除浏览数据 都会看不到原有数据，')
  console.log('        重要内容请到「数据与隐私安全」里定期导出备份。')
  console.log('')
  if (process.env.RM_NO_OPEN !== '1') {
    try {
      spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true }).unref()
    } catch {
      /* 打不开浏览器不影响服务器运行，手动访问上面的地址即可 */
    }
  }
})

server.listen(port, HOST)
