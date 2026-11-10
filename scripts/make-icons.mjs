// Renders the launcher icon + splash source images, then @capacitor/assets builds every Android size.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('assets', { recursive: true });
const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3ef0a6"/><stop offset="1" stop-color="#3aa6ff"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#3ef0a6" stop-opacity=".35"/><stop offset=".6" stop-color="#3aa6ff" stop-opacity=".12"/><stop offset="1" stop-color="#3aa6ff" stop-opacity="0"/></radialGradient>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="2.6" fill="#7fe8cf" fill-opacity=".22"/></pattern></defs>`;
const wave = (s, x0, y0) => `<path d="M${x0} ${y0}h${6*s}l${4*s} ${-11*s} ${6*s} ${22*s} ${5*s} ${-28*s} ${5*s} ${24*s} ${4*s} ${-12*s} ${3*s} ${5*s}h${7*s}" fill="none" stroke="url(#g)" stroke-width="${3.4*s}" stroke-linecap="round" stroke-linejoin="round"/>`;
// waveform path spans 40 units wide (x 12..52 in the 64 grid), height -28..+11 around baseline
const full = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${grad}<rect width="1024" height="1024" fill="#060709"/><circle cx="512" cy="512" r="430" fill="url(#glow)"/><rect width="1024" height="1024" fill="url(#dots)" opacity=".5"/>${wave(16, 512 - 20*16, 512)}</svg>`;
const fg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${grad}<circle cx="512" cy="512" r="300" fill="url(#glow)"/>${wave(11, 512 - 20*11, 512)}</svg>`;
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${grad}<rect width="1024" height="1024" fill="#060709"/><rect width="1024" height="1024" fill="url(#dots)" opacity=".45"/></svg>`;
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732">${grad}<rect width="2732" height="2732" fill="#060709"/><circle cx="1366" cy="1366" r="520" fill="url(#glow)"/>${wave(14, 1366 - 20*14, 1366)}</svg>`;
await sharp(Buffer.from(full)).png().toFile('assets/icon-only.png');
await sharp(Buffer.from(fg)).png().toFile('assets/icon-foreground.png');
await sharp(Buffer.from(bg)).png().toFile('assets/icon-background.png');
await sharp(Buffer.from(splash)).png().toFile('assets/splash.png');
await sharp(Buffer.from(splash)).png().toFile('assets/splash-dark.png');
// Play Store listing icon (512x512) and feature graphic (1024x500)
mkdirSync('store', { recursive: true });
await sharp(Buffer.from(full)).resize(512, 512).png().toFile('store/play-icon-512.png');
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">${grad}<rect width="1024" height="500" fill="#060709"/><circle cx="250" cy="250" r="260" fill="url(#glow)"/><rect width="1024" height="500" fill="url(#dots)" opacity=".35"/>${wave(7, 250 - 20*7, 260)}
<text x="470" y="235" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="64" letter-spacing="10" fill="#eef2f6">CLEAR</text>
<text x="472" y="285" font-family="Arial, sans-serif" font-weight="700" font-size="24" letter-spacing="7" fill="#8b939e">AUDIO RECORDER</text>
<text x="472" y="345" font-family="Arial, sans-serif" font-size="26" fill="url(#g)">Record. One tap. Crystal clear.</text></svg>`;
await sharp(Buffer.from(feature)).png().toFile('store/play-feature-graphic-1024x500.png');
console.log('icons rendered');
