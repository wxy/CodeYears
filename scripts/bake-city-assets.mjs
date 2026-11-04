import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';

const { values } = parseArgs({ options: { outDir: { type: 'string' } } });
if (!values.outDir) throw new Error('请用 --outDir 指定生成目录；先在系统临时目录验证样本。');
const output = resolve(values.outDir), token = randomBytes(24).toString('hex');
const project = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('./city-assets', import.meta.url)),
  publicDir: resolve(project, 'public'),
  define: { __BAKE_TOKEN__: JSON.stringify(token) },
  server: { host: '127.0.0.1', port: 4198, strictPort: true, fs: { allow: [project] } },
  plugins: [{
    name: 'write-city-sprites',
    configureServer(vite) {
      vite.middlewares.use('/__bake', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (req.headers['x-city-bake-token'] !== token) { res.writeHead(403).end(); return; }
        try {
          const chunks = []; let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 64 * 1024 * 1024) throw new Error('生成结果超出本地写入上限。');
            chunks.push(chunk);
          }
          const entries = JSON.parse(Buffer.concat(chunks).toString());
          if (!Array.isArray(entries) || !entries.length || entries.some(entry =>
            !/^[a-z][a-z0-9-]*$/.test(entry.id) || typeof entry.png !== 'string' || entry.metadata?.file !== `${entry.id}.png`)) {
            throw new Error('生成结果格式错误。');
          }
          await mkdir(output, { recursive: true });
          for (const entry of entries) await writeFile(resolve(output, entry.metadata.file), Buffer.from(entry.png, 'base64'));
          await writeFile(resolve(output, 'catalog.json'), JSON.stringify(Object.fromEntries(entries.map(entry => [entry.id, entry.metadata])), null, 2) + '\n');
          res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ output, files: entries.length }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(String(error));
        }
      });
    },
  }],
});
await server.listen();
console.log(`城市素材生成器：http://127.0.0.1:4198；输出：${output}`);
