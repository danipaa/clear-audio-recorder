// Builds two outputs from src/:
//   www/           -> the Android app's web layer (offline: local fonts + local MP3 encoder)
//   dist/preview.html -> single-file live preview (fonts + MP3 encoder from allowed CDNs)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const src = p => readFileSync(join(root, 'src', p), 'utf8');
const only = process.argv[2]; // "preview" | "www" | undefined (both)

const css = src('styles.css'), body = src('body.html'), engine = src('engine.js'), app = src('app.js');
const TITLE = 'Clear Audio Recorder';

if (!only || only === 'preview') {
  mkdirSync(join(root, 'dist'), { recursive: true });
  const html = `<title>${TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&family=Unbounded:wght@400..700&display=swap">
<style>
${css}
</style>
${body}
<script src="https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js"></script>
<script>
${engine}
</script>
<script>
${app}
</script>
`;
  writeFileSync(join(root, 'dist', 'preview.html'), html);
  console.log('built dist/preview.html', (html.length / 1024).toFixed(0) + ' KB');
}

if (!only || only === 'www') {
  const www = join(root, 'www');
  if (existsSync(www)) rmSync(www, { recursive: true });
  mkdirSync(join(www, 'fonts'), { recursive: true });
  // Local fonts so the app looks right with no internet
  const fonts = [
    ['@fontsource-variable/unbounded', 'unbounded-latin-wght-normal.woff2', 'Unbounded', '200 900'],
    ['@fontsource-variable/geist', 'geist-latin-wght-normal.woff2', 'Geist', '100 900'],
    ['@fontsource-variable/geist-mono', 'geist-mono-latin-wght-normal.woff2', 'Geist Mono', '100 900'],
  ];
  let fontCss = '';
  for (const [pkg, file, family, weight] of fonts) {
    const dir = join(dirname(require.resolve(pkg + '/package.json')), 'files');
    copyFileSync(join(dir, file), join(www, 'fonts', file));
    fontCss += `@font-face{font-family:"${family}";src:url("fonts/${file}") format("woff2");font-weight:${weight};font-style:normal;font-display:swap}\n`;
  }
  writeFileSync(join(www, 'fonts.css'), fontCss);
  writeFileSync(join(www, 'styles.css'), css);
  writeFileSync(join(www, 'engine.js'), engine);
  writeFileSync(join(www, 'app.js'), app);
  copyFileSync(require.resolve('lamejs/lame.min.js'), join(www, 'lame.min.js'));
  // Native bridge (storage, share, ads, billing) bundled with esbuild
  const esbuild = await import('esbuild');
  await esbuild.build({ entryPoints: [join(root, 'src/native/native.js')], bundle: true, format: 'iife', minify: true, target: 'es2020', outfile: join(www, 'native.js'), logLevel: 'warning' });
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#08090a">
<title>${TITLE}</title>
<link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="styles.css">
</head><body>
${body}
<script src="native.js"></script>
<script src="lame.min.js"></script>
<script src="engine.js"></script>
<script src="app.js"></script>
</body></html>
`;
  writeFileSync(join(www, 'index.html'), html);
  console.log('built www/ ->', readdirSync(www).join(', '));
}
