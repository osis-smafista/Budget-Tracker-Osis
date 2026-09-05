import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const apiUrl = process.env.API_URL;

if (!apiUrl) {
  throw new Error('Environment variable API_URL belum dibuat di Cloudflare Pages.');
}

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const file of ['index.html', 'style.css', 'script.js']) {
  await cp(file, `dist/${file}`);
}

await cp('assets', 'dist/assets', { recursive: true });

const config = `window.APP_CONFIG = ${JSON.stringify({ API_URL: apiUrl })};\n`;
await writeFile('dist/config.js', config, 'utf8');
