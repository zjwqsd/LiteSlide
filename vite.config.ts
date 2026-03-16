// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

function slideServerPlugin() {
  return {
    name: 'slide-local-server',
    configureServer(server: any) {
      const slidesDir = path.resolve(__dirname, 'public/slides');
      if (!fs.existsSync(slidesDir)) fs.mkdirSync(slidesDir, { recursive: true });

      // 1. 获取目录树 API
      server.middlewares.use('/api/files', (req: any, res: any) => {
        const getMdFiles = (dir: string, baseDir: string): string[] => {
          let results: string[] = [];
          const list = fs.readdirSync(dir, { withFileTypes: true });
          for (const file of list) {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
              results = results.concat(getMdFiles(fullPath, baseDir));
            } else if (file.name.endsWith('.md')) {
              results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
            }
          }
          return results;
        };
        const files = getMdFiles(slidesDir, path.resolve(__dirname, 'public'));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(files));
      });

      // 2. 读取文件 API
      server.middlewares.use('/api/read', (req: any, res: any) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const filePath = url.searchParams.get('path');
        const fullPath = path.resolve(__dirname, 'public', filePath as string);
        if (fs.existsSync(fullPath)) {
          res.end(fs.readFileSync(fullPath, 'utf-8'));
        } else {
          res.statusCode = 404;
          res.end('');
        }
      });

      // 3. 【核心黑魔法】：监听本地文件系统，推送热更新事件到浏览器
      server.watcher.add(slidesDir);
      server.watcher.on('all', (eventName: string, file: string) => {
        if (file.endsWith('.md')) {
          const relativePath = path.relative(path.resolve(__dirname, 'public'), file).replace(/\\/g, '/');
          server.ws.send({
            type: 'custom',
            event: 'md-update',
            data: { type: eventName, path: relativePath }
          });
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    slideServerPlugin()
  ],
})