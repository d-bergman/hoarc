import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { basePath, sourceForRoute } from './routes.mjs';

const root = path.resolve(process.env.HOARC_PREVIEW_ROOT || '.');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };
const port = Number(process.env.PORT || 4173);
http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === basePath.slice(0, -1)) { res.writeHead(301, { Location: basePath }); res.end(); return; }
    if (pathname.startsWith(basePath)) pathname = '/' + pathname.slice(basePath.length);
    if (!path.extname(pathname) && pathname !== '/') {
      const source = sourceForRoute(pathname.slice(1));
      if (!(await stat(path.join(root, source)).catch(() => null))?.isFile()) throw new Error('Not a website page');
      pathname = '/' + source;
    }
    if (!(pathname === '/' || pathname.endsWith('.html') || pathname.startsWith('/assets/') || ['/favicon.png', '/robots.txt', '/sitemap.xml'].includes(pathname))) throw new Error('Not a website file');
    let file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const bytes = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(bytes);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(path.join(root, '404.html')).catch(() => 'Not found'));
  }
}).listen(port, '127.0.0.1', () => console.log(`HOARC preview: http://127.0.0.1:${port}`));
