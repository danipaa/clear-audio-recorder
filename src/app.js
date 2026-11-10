/* Clear Audio Recorder — app UI */
(() => {
  'use strict';
  const E = window.ClearEngine;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const FREE_LIMIT = 30; // seconds of free cleaning, total
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Icons ---------- */
  const ICONS = {
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    library: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M8 13.5h1M11 12v3M14 11v5M17 13v1"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-3.6 3.8-5.6 7.5-5.6s6.7 2 7.5 5.6"/>',
    upload: '<path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5M5 14.5v3a2.5 2.5 0 0 0 2.5 2.5h9a2.5 2.5 0 0 0 2.5-2.5v-3"/>',
    sparkle: '<path d="M12 3.5c.7 4.2 2.6 6.4 6.5 7-3.9.6-5.8 2.8-6.5 7-.7-4.2-2.6-6.4-6.5-7 3.9-.6 5.8-2.8 6.5-7z" fill="currentColor" stroke="none"/><path d="M18.5 3.5v3M17 5h3" />',
    star4: '<path d="M12 1c.9 6.3 4.7 10.1 11 11-6.3.9-10.1 4.7-11 11-.9-6.3-4.7-10.1-11-11C7.3 11.1 11.1 7.3 12 1z" fill="currentColor" stroke="none"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
    pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
    back5: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v3.5H8"/><text x="12" y="15.2" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="700">5</text>',
    fwd5: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v3.5H16"/><text x="12" y="15.2" font-size="7" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="700">5</text>',
    left: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    more: '<circle cx="5.5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    folderPlus: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5h5"/>',
    inbox: '<path d="M4 13.5 6.5 5h11l2.5 8.5V19H4z"/><path d="M4 13.5h4.5l1 2h5l1-2H20"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5"/>',
    edit: '<path d="M4.5 19.5h4l10-10-4-4-10 10z"/><path d="m13 7 4 4"/>',
    move: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M9 13.5h6M12.5 11l2.5 2.5-2.5 2.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" stroke="none"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    share: '<path d="M12 3.5v11M8 7.5l4-4 4 4M5.5 12v6a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-6"/>',
    gem: '<path d="M6.5 4h11l3.5 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 16 3-16"/>',
    shield: '<path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    restore: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v3.5H8"/>',
    copy: '<rect x="8" y="8" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8V6a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2H8"/>',
    // voice effects
    fx_none: '<path d="M3 12h2.5l2-5 3 10 3-13 3 11 2-3H21"/>',
    fx_deep: '<path d="M3 9c2.5 0 2.5 6 5 6s2.5-6 5-6 2.5 6 5 6 2.5-6 3-6"/><path d="M12 17v4M9.5 18.5 12 21l2.5-2.5"/>',
    fx_chipmunk: '<path d="M3 15c1.5 0 1.5-4 3-4s1.5 4 3 4 1.5-4 3-4 1.5 4 3 4 1.5-4 3-4 1.5 4 3 4"/><path d="M12 8V3M9.5 5.5 12 3l2.5 2.5"/>',
    fx_echo: '<circle cx="7" cy="12" r="2.2"/><path d="M11 7.5a6.5 6.5 0 0 1 0 9M14.5 5a10 10 0 0 1 0 14M18 3a13 13 0 0 1 0 18"/>',
    fx_robot: '<rect x="5" y="8" width="14" height="11" rx="2.5"/><path d="M12 8V4.5M10 4.5h4M9 12.5h.01M15 12.5h.01M9 16h6M3 12v3M21 12v3"/>',
    fx_radio: '<rect x="3.5" y="8.5" width="17" height="11" rx="2.5"/><path d="M7 8.5 16 4"/><circle cx="15.5" cy="14" r="2.6"/><path d="M7 12.5h3M7 15.5h3"/>',
    fx_telephone: '<path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6a2 2 0 0 1 2-2z"/>',
    fx_cave: '<path d="M2.5 20 8 7l3.5 5 2.5-3 7.5 11z"/><path d="M10 20c0-2.2.9-3.5 2-3.5s2 1.3 2 3.5"/>',
    fx_monster: '<path d="M5 9.5 4 4l4 3.5M19 9.5 20 4l-4 3.5"/><path d="M5 10a7 7 0 0 1 14 0v4a7 7 0 0 1-14 0z"/><path d="M9 11.5h.01M15 11.5h.01M9 16l1.5-1 1.5 1 1.5-1 1.5 1"/>',
    fx_alien: '<path d="M12 4c4.5 0 7 3 7 6.5 0 4.5-4 9.5-7 9.5s-7-5-7-9.5C5 7 7.5 4 12 4z"/><path d="M8.5 11.5c1.5 0 2.5.8 2.5 2-1.5 0-2.5-.8-2.5-2zM15.5 11.5c-1.5 0-2.5.8-2.5 2 1.5 0 2.5-.8 2.5-2z"/>',
    fx_stadium: '<ellipse cx="12" cy="8" rx="9" ry="3.5"/><path d="M3 8v6c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5V8M7 11v6M12 11.5v6M17 11v6"/>',
    fx_wobble: '<path d="M2.5 12c1.6-5 3.2-5 4.8 0s3.2 5 4.7 0 3.2-5 4.8 0 3.1 5 4.7 0"/>',
  };
  const ic = (n, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ''}>${ICONS[n] || ''}</svg>`;

  const STAR = (cls = '', style = '') => `<span class="sparkle${cls ? ' ' + cls : ''}"${style ? ` style="${style}"` : ''}><svg viewBox="0 0 24 24"><path d="M12 0c.9 6.4 4.9 10.6 12 12-7.1 1.4-11.1 5.6-12 12-.9-6.4-4.9-10.6-12-12C7.1 10.6 11.1 6.4 12 0z" fill="currentColor"/></svg></span>`;

  /* ---------- KYRO pixel-dither field (WebGL) ----------
     Same shader as the KYRO site: drifting fbm clouds drawn as Bayer-ordered pixel glyphs,
     lit up in lime around a focus point. Here the focus sits on the record button and the
     glow swells with your voice level while recording. */
  const DITHER_VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }';
  const DITHER_FS = `
precision mediump float;
uniform vec2 res; uniform float t; uniform vec2 mouse; uniform float cell; uniform float boost;
uniform vec3 c0; uniform vec3 c1; uniform vec3 spark;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }
float bayer(vec2 c){ vec2 m = mod(c, 4.);
  int i = int(m.x) + int(m.y)*4; float v=0.;
  if(i==0)v=0.;else if(i==1)v=8.;else if(i==2)v=2.;else if(i==3)v=10.;else if(i==4)v=12.;else if(i==5)v=4.;else if(i==6)v=14.;else if(i==7)v=6.;
  else if(i==8)v=3.;else if(i==9)v=11.;else if(i==10)v=1.;else if(i==11)v=9.;else if(i==12)v=15.;else if(i==13)v=7.;else if(i==14)v=13.;else v=5.;
  return v/16. - .47; }
float glyph(int lv, vec2 q){
  vec2 d = abs(q - .5);
  if(lv<=0) return 0.;
  if(lv==1) return step(max(d.x,d.y), .12);
  if(lv==2) return step(min(d.x,d.y), .09) * step(max(d.x,d.y), .34);
  if(lv==3) return step(abs(d.x-d.y), .1) * step(max(d.x,d.y), .36);
  if(lv==4) return step(abs(d.x-d.y), .17);
  return 1.;
}
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 cellId = floor(frag / cell);
  vec2 q = fract(frag / cell);
  vec2 uv = (cellId * cell) / res.y;
  vec2 m = mouse * vec2(res.x/res.y, 1.);
  float d = distance(uv, m);
  vec2 drift = vec2(t*.018, -t*.008);
  float f = fbm(uv*1.6 + drift + fbm(uv*1.2 - drift)*0.9);
  f = (f - .5) * 2.1 + .5;
  f += smoothstep(.45, 0., d) * (.35 + boost*.55);
  f *= smoothstep(1.25, .25, uv.y);
  int lv = int(clamp(floor(f*5. + .5 + bayer(cellId)*1.15), 0., 5.));
  float on = glyph(lv, q);
  float glow = clamp(smoothstep(.35 + boost*.25, 0., d) * (1. + boost), 0., 1.);
  vec3 col = mix(c1, spark, glow*.6);
  gl_FragColor = vec4(mix(c0, col, on), 1.);
}`;
  function createDither(canvas, { cell = 6, bg = [0.031, 0.035, 0.039], focus = null, boost = () => 0, active = () => true } = {}) {
    let gl = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch (e) { }
    if (!gl) return null;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, DITHER_VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, DITHER_FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = k => gl.getUniformLocation(prog, k);
    gl.uniform3fv(U('c0'), bg); gl.uniform3fv(U('c1'), [0.933, 0.918, 0.886]); gl.uniform3fv(U('spark'), [0.84, 1, 0.25]);
    const scale = 0.5;
    const size = () => { const r = canvas.getBoundingClientRect(); const w = Math.max(1, Math.floor(r.width * scale)), h = Math.max(1, Math.floor(r.height * scale)); if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; } gl.viewport(0, 0, w, h); gl.uniform2f(U('res'), w, h); gl.uniform1f(U('cell'), cell * scale * ((window.devicePixelRatio || 1) > 1 ? 1.4 : 1)); };
    size(); let ro = null; try { ro = new ResizeObserver(size); ro.observe(canvas); } catch (e) { }
    const M = { x: 0.5, y: 0.45, tx: 0.5, ty: 0.45 }, start = performance.now(); let raf = 0, last = 0, pointerUntil = 0, b = 0;
    const host = canvas.parentElement;
    const onMove = e => { const r = canvas.getBoundingClientRect(); if (e.clientY < r.top || e.clientY > r.bottom) return; M.tx = (e.clientX - r.left) / r.width; M.ty = 1 - (e.clientY - r.top) / r.height; pointerUntil = performance.now() + 2500; };
    host && host.addEventListener('pointermove', onMove, { passive: true });
    const frame = now => {
      const t = (now - start) / 1000;
      if (now > pointerUntil && focus) { const f = focus(); if (f) { M.tx = f.x + Math.sin(t * 0.35) * 0.05; M.ty = f.y + Math.cos(t * 0.28) * 0.04; } }
      M.x += (M.tx - M.x) * 0.08; M.y += (M.ty - M.y) * 0.08; b += (boost() - b) * 0.25;
      gl.uniform1f(U('t'), reduceMotion ? 8 : t); gl.uniform2f(U('mouse'), M.x, M.y); gl.uniform1f(U('boost'), b);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = now => { raf = requestAnimationFrame(loop); if (now - last < 33 || document.hidden || !active()) return; last = now; frame(now); };
    if (reduceMotion) { frame(performance.now()); } else raf = requestAnimationFrame(loop);
    return { stop() { cancelAnimationFrame(raf); ro && ro.disconnect(); host && host.removeEventListener('pointermove', onMove); }, redraw() { size(); frame(performance.now()); } };
  }

  /* ---------- Small helpers ---------- */
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, '0')}`; };
  const fmtDate = t => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const safeFile = s => (s || 'audio').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'audio';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Tiny ZIP writer (preview downloads only) ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function makeZip(name, data) {
    const nb = new TextEncoder().encode(name), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nb.length, true);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nb.length, true);
    const cdOff = 30 + nb.length + data.length, cdLen = 46 + nb.length;
    const end = new DataView(new ArrayBuffer(22)); end.setUint32(0, 0x06054b50, true); end.setUint16(8, 1, true); end.setUint16(10, 1, true); end.setUint32(12, cdLen, true); end.setUint32(16, cdOff, true);
    return new Blob([lh.buffer, nb, data, ch.buffer, nb, end.buffer], { type: 'application/zip' });
  }

  /* ---------- State ---------- */
  const state = { meta: null, pro: false, view: 'record', folder: 'all', search: '', sort: 'new', editor: null };
  const freshMeta = () => ({ v: 1, counter: 0, freeUsed: 0, folders: [], recordings: [], settings: { strength: 'medium', format: 'mp3', kbps: 192 }, seeded: false, demoPro: false });

  /* ---------- Web platform (preview / browser) ---------- */
  const WebPlatform = (() => {
    let db = null, opened = false; const mem = { kv: new Map(), audio: new Map() };
    const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    async function open() {
      if (opened) return db; opened = true;
      try { const r = indexedDB.open('clear-audio-recorder', 1); r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('audio'); }; db = await req(r); } catch (e) { db = null; }
      return db;
    }
    async function get(store, key) {
      const d = await open(); if (!d) return mem[store].get(key);
      try { return await req(d.transaction(store).objectStore(store).get(key)); } catch (e) { return mem[store].get(key); }
    }
    async function put(store, key, val) {
      mem[store].set(key, val); const d = await open(); if (!d) return;
      try { const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).put(val, key); await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { /* memory copy kept */ }
    }
    async function del(store, key) {
      mem[store].delete(key); const d = await open(); if (!d) return;
      try { const tx = d.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); } catch (e) { }
    }
    let dlPromise = null;
    return {
      name: 'web',
      async init() { await open(); try { dlPromise = window.claude && window.claude.use ? window.claude.use('downloads') : null; } catch (e) { dlPromise = null; } },
      loadMeta: () => get('kv', 'meta'),
      saveMeta: m => put('kv', 'meta', JSON.parse(JSON.stringify(m))),
      putAudio: (k, bytes) => put('audio', k, new Blob([bytes], { type: 'audio/wav' })),
      async getAudio(k) { const b = await get('audio', k); return b ? new Uint8Array(await b.arrayBuffer()) : null; },
      deleteAudio: k => del('audio', k),
      async exportFile(filename, bytes, mime) {
        const dl = dlPromise ? await dlPromise : null;
        if (dl) {
          try {
            await dl.save({ filename: filename.replace(/\.[^.]+$/, '') + '.zip', data: makeZip(filename, bytes) });
            return { ok: true, note: 'Saved as a .zip in this preview. The phone app saves MP3/WAV directly.' };
          } catch (e) {
            if (e && e.code === 'declined') return { ok: false, quiet: true };
            return { ok: false, message: 'Downloads are not available in this view.' };
          }
        }
        if (window.claude) return { ok: false, message: 'Downloads are not available in this view.' };
        const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
        const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return { ok: true };
      },
      billing: {
        price: '$2.00', demo: true,
        async init() { },
        async isPro() { return !!(state.meta && state.meta.demoPro); },
        async purchase() { state.meta.demoPro = true; await saveMeta(); return { ok: true }; },
        async restore() { return { ok: true, pro: !!state.meta.demoPro }; },
      },
      ads: {
        demo: true,
        async init() { },
        async showBanner() { $('#adBanner').hidden = false; document.documentElement.style.setProperty('--ad-h', '52px'); },
        async hideBanner() { $('#adBanner').hidden = true; document.documentElement.style.setProperty('--ad-h', '0px'); },
        interstitial() {
          return new Promise(res => {
            const el = $('#interstitial'), btn = $('#adClose'), cnt = $('#adCount'); el.hidden = false; btn.disabled = true;
            let n = 3; cnt.textContent = n;
            const t = setInterval(() => { n--; cnt.textContent = n; if (n <= 0) { clearInterval(t); btn.disabled = false; cnt.textContent = ''; } }, 1000);
            btn.onclick = () => { el.hidden = true; res(); };
          });
        },
      },
    };
  })();
  const P = window.NativePlatform || WebPlatform;

  /* ---------- Persistence ---------- */
  let saveTimer = null;
  function saveMeta() { clearTimeout(saveTimer); return new Promise(res => { saveTimer = setTimeout(async () => { try { await P.saveMeta(state.meta); } catch (e) { console.warn(e); } res(); }, 60); }); }
  const recById = id => state.meta.recordings.find(r => r.id === id);
  const folderById = id => state.meta.folders.find(f => f.id === id);
  const folderName = id => (id && folderById(id)) ? folderById(id).name : 'Unsorted';

  /* ---------- Audio helpers ---------- */
  let ctx = null;
  const audioCtx = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
  async function decodeFile(arrayBuffer) {
    const buf = await audioCtx().decodeAudioData(arrayBuffer.slice(0));
    const chans = []; for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c));
    let samples = E.toMono(chans), sr = buf.sampleRate;
    if (sr > 48000) { samples = E.resampleLinear(samples, sr, 48000); sr = 48000; }
    return { samples, sr };
  }
  async function loadSamples(key) { const b = await P.getAudio(key); if (!b) return null; return E.decodeWAV(b); }

  async function addRecording({ samples, sr, name, folderId = null, isSample = false }) {
    const id = uid();
    await P.putAudio(id + '.orig', E.encodeWAV(samples, sr));
    const rec = { id, name, folderId, createdAt: Date.now(), duration: samples.length / sr, sampleRate: sr, peaks: E.peaks(samples, 36), cleaned: null, effect: 'none', pitch: 0, hasProc: false, isSample, freeCharged: false };
    state.meta.recordings.unshift(rec);
    await saveMeta();
    renderLists();
    return rec;
  }
  async function removeRecording(id) {
    const i = state.meta.recordings.findIndex(r => r.id === id); if (i < 0) return;
    state.meta.recordings.splice(i, 1);
    await Promise.all(['.orig', '.clean', '.proc'].map(s => P.deleteAudio(id + s)));
    await saveMeta(); renderLists();
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg, icon = 'check') {
    const t = $('#toast'); t.innerHTML = (icon ? ic(icon) : '') + `<span>${esc(msg)}</span>`;
    t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
  }

  /* ---------- Bottom sheets ---------- */
  let sheetResolve = null;
  function openSheet(html, onMount) {
    if (sheetResolve) closeSheet(null);
    const sh = $('#sheet');
    sh.innerHTML = '<div class="grabber"></div>' + html;
    $('#scrim').classList.add('on');
    requestAnimationFrame(() => sh.classList.add('on'));
    return new Promise(res => { sheetResolve = res; if (onMount) onMount(sh); });
  }
  function closeSheet(val) {
    const sh = $('#sheet'); sh.classList.remove('on'); $('#scrim').classList.remove('on');
    const r = sheetResolve; sheetResolve = null; if (r) r(val);
  }
  const sheetOpen = () => !!sheetResolve;
  function actionSheet(title, actions) {
    return openSheet(`${title ? `<h2>${esc(title)}</h2>` : ''}<div class="action-list">${actions.map((a, i) =>
      `<button class="action${a.danger ? ' danger' : ''}" data-i="${i}">${ic(a.icon)}<span>${esc(a.label)}</span>${a.checked ? ic('check', 'check') : ''}</button>`).join('')}</div>`,
      sh => $$('.action', sh).forEach(b => b.onclick = () => closeSheet(actions[+b.dataset.i].value)));
  }
  function promptSheet({ title, sub = '', value = '', placeholder = '', confirm = 'Save' }) {
    return openSheet(`<h2>${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : '<div style="height:12px"></div>'}
      <form id="pf"><input class="field" id="pfInput" maxlength="80" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(value)}">
      <div class="sheet-actions"><button class="cta" type="submit">${esc(confirm)}</button><button class="btn-text" type="button" id="pfCancel">Cancel</button></div></form>`,
      sh => {
        const inp = $('#pfInput', sh); setTimeout(() => { inp.focus(); inp.select(); }, 350);
        $('#pf', sh).onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (v) closeSheet(v); else inp.focus(); };
        $('#pfCancel', sh).onclick = () => closeSheet(null);
      });
  }
  function confirmSheet({ title, sub, confirm, danger }) {
    return openSheet(`<h2>${esc(title)}</h2><p class="sub">${esc(sub)}</p><div class="sheet-actions">
      <button class="btn-2${danger ? ' btn-danger' : ''}" id="cfYes">${esc(confirm)}</button><button class="btn-text" id="cfNo">Cancel</button></div>`,
      sh => { $('#cfYes', sh).onclick = () => closeSheet(true); $('#cfNo', sh).onclick = () => closeSheet(false); });
  }
  async function pickFolder(current) {
    const acts = [{ icon: 'inbox', label: 'Unsorted', value: '__none', checked: !current },
      ...state.meta.folders.map(f => ({ icon: 'folder', label: f.name, value: f.id, checked: current === f.id })),
      { icon: 'folderPlus', label: 'New folder…', value: '__new' }];
    const v = await actionSheet('Move to', acts);
    if (v === null || v === undefined) return undefined;
    if (v === '__none') return null;
    if (v === '__new') { const f = await createFolder(); return f ? f.id : undefined; }
    return v;
  }
  async function createFolder() {
    const name = await promptSheet({ title: 'New folder', sub: 'Group recordings by project, class or client.', placeholder: 'e.g. Podcast episodes', confirm: 'Create folder' });
    if (!name) return null;
    const f = { id: uid(), name, createdAt: Date.now() };
    state.meta.folders.push(f); await saveMeta(); renderLists(); toast(`Folder "${name}" created`);
    return f;
  }

  /* ---------- Paywall ---------- */
  async function paywall(reason) {
    const b = P.billing;
    const v = await openSheet(`<div class="paywall"><div class="glow-spark"></div><div class="glow-emerald"></div>
      ${STAR()}
      <div><span class="pw-badge">Clear Pro</span></div>
      <div class="pw-price">${esc(b.price || '$2.00')}<small> / month</small></div>
      ${reason ? `<p class="sub" style="margin:12px 0 0">${esc(reason)}</p>` : ''}
      <ul class="pw-list">
        <li>${ic('star4')}Unlimited one-tap noise removal</li>
        <li>${ic('fx_robot')}All 12 voice effects and pitch control</li>
        <li>${ic('shield')}No ads, ever</li>
        <li>${ic('folder')}Unlimited folders and recordings</li>
      </ul>
      <div class="sheet-actions"><button class="cta" id="pwBuy">${ic('star4', 'star')}Start Pro · ${esc(b.price || '$2.00')}/month</button>
      <button class="btn-text" id="pwRestore">Restore purchase</button></div>
      <p class="pw-note">${b.demo ? 'Preview mode: no payment is taken here. In the app this opens Google Play billing.' : 'Billed monthly through Google Play. Cancel anytime in Play Store → Subscriptions.'}</p></div>`,
      sh => {
        $('#pwBuy', sh).onclick = async e => {
          const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Opening Google Play…';
          const r = await b.purchase(); btn.disabled = false; btn.innerHTML = `${ic('star4', 'star')}Start Pro · ${esc(b.price || '$2.00')}/month`;
          if (r.ok) closeSheet('pro'); else if (!r.quiet) toast(r.message || 'Purchase didn\'t go through', 'x');
        };
        $('#pwRestore', sh).onclick = async () => { const r = await b.restore(); if (r.pro) closeSheet('pro'); else toast('No active subscription found', 'x'); };
      });
    if (v === 'pro') await becomePro();
    return v === 'pro';
  }
  async function becomePro() {
    state.pro = true; await P.ads.hideBanner(); renderPlan(); renderSettings(); if (state.editor) renderEditorPanels();
    burst(window.innerWidth / 2, window.innerHeight * 0.4); toast('Welcome to Clear Pro', 'star4');
  }

  /* ---------- Plan chip ---------- */
  function renderPlan() {
    const c = $('#planChip');
    if (state.pro) { c.className = 'plan-chip pro'; c.innerHTML = `${ic('star4', 'plan-meter')}<span>PRO</span>`; c.setAttribute('aria-label', 'Clear Pro is active'); return; }
    const left = Math.max(0, FREE_LIMIT - state.meta.freeUsed), frac = left / FREE_LIMIT, R = 9, C = 2 * Math.PI * R;
    c.className = 'plan-chip';
    c.innerHTML = `<svg class="plan-meter" viewBox="0 0 22 22"><circle cx="11" cy="11" r="${R}" fill="none" stroke="#2a2f33" stroke-width="3"/><circle cx="11" cy="11" r="${R}" fill="none" stroke="url(#pg)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}" transform="rotate(-90 11 11)" style="transition:stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)"/><defs><linearGradient id="pg"><stop offset="0" stop-color="#1ed68a"/><stop offset="1" stop-color="#d6ff3f"/></linearGradient></defs></svg><span>${left > 0 ? `${left}s free` : 'Go Pro'}</span>`;
    c.setAttribute('aria-label', `${left} seconds of free cleaning left. Tap to see Pro.`);
  }

  /* ---------- Views / tabs ---------- */
  function go(view) {
    if (state.view === view) return;
    state.view = view;
    $$('.view').forEach(v => { const on = v.dataset.view === view; v.hidden = !on; if (on) { v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); } });
    $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.go === view)));
    moveTabPill();
    if (view === 'library') renderLibrary();
    if (view === 'settings') renderSettings();
  }

  function moveTabPill() {
    const idx = Math.max(0, ['record', 'library', 'settings'].indexOf(state.view));
    $('#tabPill').style.transform = `translateX(calc(${idx} * (100% + 4px)))`;
  }

  /* ---------- Lists ---------- */
  function miniWave(peaks) {
    const n = peaks.length || 1, w = 36 / n;
    const col = i => { const t = i / Math.max(1, n - 1); return `rgb(${Math.round(30 + (214 - 30) * t)},${Math.round(214 + (255 - 214) * t)},${Math.round(138 + (63 - 138) * t)})`; };
    return `<svg viewBox="0 0 36 24" preserveAspectRatio="none">${peaks.map((p, i) => { const h = Math.max(1.5, p * 22); return `<rect x="${(i * w).toFixed(2)}" y="${(12 - h / 2).toFixed(2)}" width="${(w * 0.6).toFixed(2)}" height="${h.toFixed(2)}" rx=".5" fill="${col(i)}"/>`; }).join('')}</svg>`;
  }
  function itemHTML(r, i, showFolder) {
    const fx = r.effect && r.effect !== 'none' ? E.EFFECTS.find(e => e.id === r.effect) : null;
    return `<li class="rec-item" style="--i:${i}" data-id="${r.id}">
      <button class="rec-open" data-open="${r.id}" aria-label="Open ${esc(r.name)}"><span class="rec-thumb">${miniWave(r.peaks || [])}</span>
      <span class="rec-meta"><span class="rec-name" style="display:block">${esc(r.name)}</span>
      <span class="rec-sub"><span class="mono">${fmt(r.duration)}</span><span>·</span><span>${fmtDate(r.createdAt)}</span>
      ${r.cleaned ? '<span class="badge">Clean</span>' : ''}${fx ? `<span class="badge b-fx">${esc(fx.name)}</span>` : ''}${r.pitch ? `<span class="badge b-fx">${r.pitch > 0 ? '+' : ''}${r.pitch} st</span>` : ''}
      ${showFolder ? `<span class="badge folder">${esc(folderName(r.folderId))}</span>` : ''}</span></span></button>
      <button class="icon-btn" data-menu="${r.id}" aria-label="More for ${esc(r.name)}">${ic('more')}</button></li>`;
  }
  function renderRecent() {
    const list = state.meta.recordings.slice(0, 3);
    $('#recentList').innerHTML = list.length ? list.map((r, i) => itemHTML(r, i, true)).join('')
      : '<li class="empty"><b>No recordings yet</b>Tap the red button or import a file to start.</li>';
  }
  function filtered() {
    const q = state.search.trim().toLowerCase();
    let list = state.meta.recordings.filter(r =>
      state.folder === 'all' ? true : state.folder === 'unsorted' ? !r.folderId : r.folderId === state.folder);
    if (q) list = list.filter(r => r.name.toLowerCase().includes(q) || folderName(r.folderId).toLowerCase().includes(q));
    const by = { new: (a, b) => b.createdAt - a.createdAt, old: (a, b) => a.createdAt - b.createdAt, name: (a, b) => a.name.localeCompare(b.name), long: (a, b) => b.duration - a.duration }[state.sort];
    return list.sort(by);
  }
  function renderLibrary() {
    const recs = state.meta.recordings, count = id => id === 'all' ? recs.length : id === 'unsorted' ? recs.filter(r => !r.folderId).length : recs.filter(r => r.folderId === id).length;
    if (state.folder !== 'all' && state.folder !== 'unsorted' && !folderById(state.folder)) state.folder = 'all';
    const chips = [{ id: 'all', name: 'All', icon: 'library' }, { id: 'unsorted', name: 'Unsorted', icon: 'inbox' }, ...state.meta.folders.map(f => ({ id: f.id, name: f.name, icon: 'folder' }))];
    $('#folderChips').innerHTML = chips.map(c => `<button class="chip" data-folder="${c.id}" aria-pressed="${state.folder === c.id}">${ic(c.icon)}${esc(c.name)}<span class="n">${count(c.id)}</span></button>`).join('')
      + `<button class="chip add" id="chipAdd">${ic('folderPlus')}New folder</button>`;
    const list = filtered();
    $('#libList').innerHTML = list.map((r, i) => itemHTML(r, i, state.folder === 'all' || !!state.search)).join('');
    $('#libEmpty').hidden = list.length > 0;
    $('#libEmpty').innerHTML = state.search ? `<b>Nothing matches "${esc(state.search)}"</b>Try another name or folder.` : state.folder === 'all' ? '<b>Your library is empty</b>Record or import audio to fill it.' : '<b>This folder is empty</b>Open any recording\'s menu and choose Move to.';
    const custom = folderById(state.folder);
    $('#libCount').textContent = `${list.length} recording${list.length === 1 ? '' : 's'}${custom ? ` in ${custom.name}` : ''}`;
    $('#folderMenu').hidden = !custom;
  }
  function renderLists() { renderRecent(); if (state.view === 'library') renderLibrary(); if (state.view === 'settings') renderSettings(); }

  async function itemMenu(id) {
    const r = recById(id); if (!r) return;
    const v = await actionSheet(r.name, [
      { icon: 'play', label: 'Open', value: 'open' },
      { icon: 'edit', label: 'Rename', value: 'rename' },
      { icon: 'move', label: `Move to folder (now: ${folderName(r.folderId)})`, value: 'move' },
      { icon: 'trash', label: 'Delete', value: 'delete', danger: true }]);
    if (v === 'open') openEditor(id);
    if (v === 'rename') await renameRec(r);
    if (v === 'move') await moveRec(r);
    if (v === 'delete') await deleteRec(r);
  }
  async function renameRec(r) {
    const name = await promptSheet({ title: 'Rename recording', value: r.name, confirm: 'Rename' });
    if (!name) return; r.name = name; await saveMeta(); renderLists(); if (state.editor && state.editor.rec === r) $('#edName').textContent = name; toast('Renamed');
  }
  async function moveRec(r) {
    const to = await pickFolder(r.folderId); if (to === undefined) return;
    r.folderId = to; await saveMeta(); renderLists(); if (state.editor && state.editor.rec === r) renderEditorHead();
    toast(`Moved to ${folderName(to)}`, 'move');
  }
  async function deleteRec(r) {
    const ok = await confirmSheet({ title: `Delete "${r.name}"?`, sub: 'This removes the recording and its cleaned versions from this phone. It can\'t be undone.', confirm: 'Delete recording', danger: true });
    if (!ok) return; if (state.editor && state.editor.rec === r) closeEditor(); await removeRecording(r.id); toast('Recording deleted', 'trash');
  }
  async function folderMenu() {
    const f = folderById(state.folder); if (!f) return;
    const v = await actionSheet(f.name, [{ icon: 'edit', label: 'Rename folder', value: 'rename' }, { icon: 'trash', label: 'Delete folder', value: 'delete', danger: true }]);
    if (v === 'rename') { const n = await promptSheet({ title: 'Rename folder', value: f.name, confirm: 'Rename' }); if (n) { f.name = n; await saveMeta(); renderLists(); toast('Folder renamed'); } }
    if (v === 'delete') {
      const inside = state.meta.recordings.filter(r => r.folderId === f.id).length;
      const ok = await confirmSheet({ title: `Delete "${f.name}"?`, sub: inside ? `The ${inside} recording${inside > 1 ? 's' : ''} inside will move to Unsorted. Nothing is deleted.` : 'This folder is empty.', confirm: 'Delete folder', danger: true });
      if (!ok) return;
      state.meta.recordings.forEach(r => { if (r.folderId === f.id) r.folderId = null; });
      state.meta.folders = state.meta.folders.filter(x => x !== f); state.folder = 'all'; await saveMeta(); renderLists(); toast('Folder deleted', 'trash');
    }
  }

  /* ---------- Settings ---------- */
  function renderSettings() {
    const m = state.meta, s = m.settings;
    const bytes = m.recordings.reduce((a, r) => a + r.duration * r.sampleRate * 2 * (1 + (r.cleaned ? 1 : 0) + (r.hasProc ? 1 : 0)), 0);
    $('#proCard').innerHTML = state.pro
      ? `<div class="glow-emerald"></div><div class="glow-spark"></div><div class="eyebrow">Plan · Pro</div><h2>You're on Clear Pro ${STAR()}</h2><p>Unlimited cleaning, every effect, no ads. Manage or cancel anytime in Google Play → Subscriptions.</p>`
      : `<div class="glow-emerald"></div><div class="glow-spark"></div><div class="eyebrow">Plan · Free</div><h2>Clean without limits ${STAR()}</h2><p>You've used ${m.freeUsed} of ${FREE_LIMIT} free seconds. Pro removes the limit, unlocks all 12 effects and turns off ads.</p><button class="cta" id="setPro">${ic('star4', 'star')}Get Pro · ${esc(P.billing.price || '$2.00')}/month</button>`;
    const sp = $('#setPro'); if (sp) sp.onclick = () => paywall();
    setSeg($('#setStrength'), s.strength); setSeg($('#setFormat'), s.format);
    $('#setKbps').value = String(s.kbps);
    $('#storageInfo').textContent = `${m.recordings.length} recording${m.recordings.length === 1 ? '' : 's'} · ${(bytes / 1048576).toFixed(1)} MB · ${m.folders.length} folder${m.folders.length === 1 ? '' : 's'}`;
    $('#resetRow').hidden = P.name !== 'web';
  }

  /* ---------- Segmented controls ---------- */
  function setSeg(seg, value) {
    const btns = $$('button', seg); let pill = $('.seg-pill', seg);
    if (!pill) { pill = document.createElement('span'); pill.className = 'seg-pill'; seg.prepend(pill); }
    let idx = btns.findIndex(b => b.dataset.v === String(value)); if (idx < 0) idx = 0;
    btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === idx)));
    pill.style.width = `calc((100% - 8px) / ${btns.length})`;
    pill.style.transform = `translateX(${idx * 100}%)`;
  }
  const segValue = seg => { const b = $('button[aria-pressed="true"]', seg); return b ? b.dataset.v : null; };

  /* ---------- Recorder ---------- */
  let liveLevel = 0;
  const R = { status: 'idle', stream: null, mr: null, chunks: [], analyser: null, src: null, startAt: 0, before: 0, levels: [], raf: 0 };
  const elapsed = () => R.before + (R.status === 'recording' ? (performance.now() - R.startAt) / 1000 : 0);
  function setRecUI() {
    const st = $('#recStage');
    st.classList.toggle('recording', R.status === 'recording'); st.classList.toggle('paused', R.status === 'paused');
    $('#recStatusText').innerHTML = { idle: 'Ready to record<span class="caret"></span>', recording: 'Recording', paused: 'Paused' }[R.status];
    $('#recBtn').setAttribute('aria-label', R.status === 'idle' ? 'Start recording' : 'Stop and save');
    $('#recPause').disabled = $('#recDiscard').disabled = R.status === 'idle';
    $('#recPause').innerHTML = R.status === 'paused' ? ic('mic') : ic('pause');
    $('#recPause').setAttribute('aria-label', R.status === 'paused' ? 'Resume' : 'Pause');
    $('#recHint').textContent = R.status === 'idle' ? 'Tap to record. Saved only on this phone.' : R.status === 'paused' ? 'Paused. Tap the mic to continue, or stop to save.' : 'Tap stop to save.';
  }
  function micBlocked() {
    openSheet(`<h2>Microphone is off here</h2><p class="sub">This preview can't use your microphone. In the Clear Audio Recorder app, recording works right away after you allow mic access.</p>
      <div class="sheet-actions"><button class="cta" id="mbImport">${ic('upload')}Import a file instead</button><button class="btn-2" id="mbSample">${ic('star4')}Try the noisy sample</button><button class="btn-text" id="mbClose">Close</button></div>`,
      sh => { $('#mbImport', sh).onclick = () => { closeSheet(); $('#fileInput').click(); }; $('#mbSample', sh).onclick = () => { closeSheet(); trySample(); }; $('#mbClose', sh).onclick = () => closeSheet(); });
  }
  async function startRec() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) return micBlocked();
    try {
      R.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
    } catch (e) { return micBlocked(); }
    const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    R.mr = new MediaRecorder(R.stream, type ? { mimeType: type, audioBitsPerSecond: 160000 } : undefined);
    R.chunks = []; R.mr.ondataavailable = e => { if (e.data && e.data.size) R.chunks.push(e.data); };
    R.mr.start(250);
    const ac = audioCtx(); await ac.resume();
    R.src = ac.createMediaStreamSource(R.stream); R.analyser = ac.createAnalyser(); R.analyser.fftSize = 1024; R.src.connect(R.analyser);
    R.levels = []; R.before = 0; R.startAt = performance.now(); R.status = 'recording'; setRecUI(); recLoop();
    if (navigator.vibrate) navigator.vibrate(12);
  }
  function togglePause() {
    if (R.status === 'recording') { R.mr.pause(); R.before = elapsed(); R.status = 'paused'; }
    else if (R.status === 'paused') { R.mr.resume(); R.startAt = performance.now(); R.status = 'recording'; }
    setRecUI();
  }
  function teardownRec() {
    cancelAnimationFrame(R.raf);
    if (R.stream) R.stream.getTracks().forEach(t => t.stop());
    try { R.src && R.src.disconnect(); } catch (e) { }
    R.stream = R.mr = R.src = R.analyser = null; R.status = 'idle'; R.levels = [];
    liveLevel = 0; document.documentElement.style.setProperty('--lvl', 0);
    setRecUI(); drawLive(); $('#recTime').innerHTML = '00:00<span>.0</span>';
  }
  function stopRec(save = true) {
    if (!R.mr) return;
    const mr = R.mr, len = elapsed();
    mr.onstop = async () => {
      const chunks = R.chunks.slice(); teardownRec();
      if (!save) { toast('Recording discarded', 'trash'); return; }
      if (len < 0.4) { toast('Recording was too short', 'x'); return; }
      try {
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        const { samples, sr } = await decodeFile(await blob.arrayBuffer());
        state.meta.counter += 1;
        const folderId = folderById(state.folder) ? state.folder : null;
        const rec = await addRecording({ samples, sr, name: `Recording ${String(state.meta.counter).padStart(3, '0')}`, folderId });
        toast('Saved to your library');
        openEditor(rec.id);
      } catch (e) { console.error(e); toast('Couldn\'t save that recording', 'x'); }
    };
    if (mr.state !== 'inactive') mr.stop(); else mr.onstop();
  }
  async function discardRec() {
    const ok = await confirmSheet({ title: 'Discard this recording?', sub: 'It hasn\'t been saved yet.', confirm: 'Discard', danger: true });
    if (ok) stopRec(false);
  }
  function recLoop() {
    if (!R.analyser) return;
    const buf = new Float32Array(R.analyser.fftSize);
    const step = () => {
      if (!R.analyser) return;
      R.analyser.getFloatTimeDomainData(buf);
      let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const lvl = R.status === 'recording' ? Math.min(1, Math.sqrt(s / buf.length) * 5) : 0;
      if (R.status === 'recording') { R.levels.push(lvl); if (R.levels.length > 400) R.levels.shift(); }
      liveLevel = lvl; document.documentElement.style.setProperty('--lvl', lvl.toFixed(3));
      const t = elapsed(), m = Math.floor(t / 60), sec = Math.floor(t % 60), d = Math.floor((t * 10) % 10);
      $('#recTime').innerHTML = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}<span>.${d}</span>`;
      drawLive(); R.raf = requestAnimationFrame(step);
    };
    step();
  }
  function fitCanvas(c) {
    const dpr = Math.min(3, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return { g, w, h };
  }
  function drawLive() {
    const c = $('#liveWave'); if (!c || !c.clientWidth) return;
    const { g, w, h } = fitCanvas(c); g.clearRect(0, 0, w, h);
    const bw = 3, gap = 3, n = Math.floor(w / (bw + gap)), lv = R.levels;
    const grad = g.createLinearGradient(0, 0, w, 0); grad.addColorStop(0, '#1ed68a'); grad.addColorStop(1, '#d6ff3f');
    for (let i = 0; i < n; i++) {
      const li = lv.length - n + i, v = li >= 0 ? lv[li] : 0;
      const idle = R.status === 'idle' ? 0.04 + 0.03 * Math.sin(i * 0.5 + performance.now() / 600) : 0;
      const bh = Math.max(3, (v + idle) * h * 0.95);
      g.fillStyle = li >= 0 && v > 0 ? grad : '#2a2f33';
      g.beginPath(); g.roundRect ? g.roundRect(i * (bw + gap), (h - bh) / 2, bw, bh, 1.5) : g.rect(i * (bw + gap), (h - bh) / 2, bw, bh); g.fill();
    }
  }
  let idleRaf = 0;
  function idleLoop() { if (R.status === 'idle' && state.view === 'record' && !reduceMotion) drawLive(); idleRaf = requestAnimationFrame(idleLoop); }

  /* ---------- Import & sample ---------- */
  async function importFiles(files) {
    let last = null, ok = 0;
    for (const f of files) {
      try {
        const { samples, sr } = await decodeFile(await f.arrayBuffer());
        const folderId = folderById(state.folder) ? state.folder : null;
        last = await addRecording({ samples, sr, name: f.name.replace(/\.[^.]+$/, '') || 'Imported audio', folderId }); ok++;
      } catch (e) { console.warn(e); toast(`Couldn't read ${f.name}. Try MP3, WAV, M4A or a video.`, 'x'); }
    }
    if (ok === 1 && last) { toast('Imported'); openEditor(last.id); }
    else if (ok > 1) { toast(`Imported ${ok} files`); go('library'); }
  }
  async function trySample() {
    const existing = state.meta.recordings.find(r => r.isSample);
    if (existing) { openEditor(existing.id); return; }
    const { mixed } = E.demoClip(44100, 6);
    const vn = state.meta.folders.find(f => f.name === 'Voice notes');
    const rec = await addRecording({ samples: mixed, sr: 44100, name: 'Sample · noisy room (demo)', folderId: vn ? vn.id : null, isSample: true });
    openEditor(rec.id);
  }

  /* ---------- Player ---------- */
  const PL = { buf: null, src: null, start: 0, offset: 0, playing: false, raf: 0 };
  function setBuffer(samples, sr) {
    const keep = plPos(), was = PL.playing; plStop();
    const b = audioCtx().createBuffer(1, samples.length, sr); b.copyToChannel(samples, 0);
    PL.buf = b; PL.offset = Math.min(keep, b.duration);
    if (was) plPlay();
  }
  function plPos() { return PL.playing ? audioCtx().currentTime - PL.start : PL.offset; }
  function plPlay() {
    if (!PL.buf) return; const ac = audioCtx(); ac.resume();
    if (PL.offset >= PL.buf.duration - 0.05) PL.offset = 0;
    const s = ac.createBufferSource(); s.buffer = PL.buf; s.connect(ac.destination);
    s.onended = () => { if (PL.src === s) { PL.playing = false; PL.offset = 0; PL.src = null; playUI(); drawEditor(); } };
    s.start(0, PL.offset); PL.src = s; PL.start = ac.currentTime - PL.offset; PL.playing = true; playUI(); tick();
  }
  function plPause() { if (!PL.playing) return; PL.offset = plPos(); const s = PL.src; PL.src = null; PL.playing = false; try { s.stop(); } catch (e) { } playUI(); }
  function plStop() { if (PL.src) { const s = PL.src; PL.src = null; try { s.stop(); } catch (e) { } } PL.playing = false; cancelAnimationFrame(PL.raf); }
  function plSeek(t) { if (!PL.buf) return; const was = PL.playing; plPause(); PL.offset = clamp(t, 0, PL.buf.duration); if (was) plPlay(); else { drawEditor(); timeUI(); } }
  function playUI() { const b = $('#playBtn'); b.innerHTML = PL.playing ? ic('pause') : ic('play'); b.setAttribute('aria-label', PL.playing ? 'Pause' : 'Play'); }
  function timeUI() { $('#tCur').textContent = fmt(plPos()); $('#tDur').textContent = fmt(PL.buf ? PL.buf.duration : 0); }
  function tick() { cancelAnimationFrame(PL.raf); const step = () => { timeUI(); drawEditor(); if (PL.playing) PL.raf = requestAnimationFrame(step); }; step(); }

  /* ---------- Editor ---------- */
  function edSamples(ed, ver) { return ver === 'orig' ? ed.orig : (ed.proc || ed.clean || ed.orig); }
  async function openEditor(id) {
    const rec = recById(id); if (!rec) return;
    if (sheetOpen()) closeSheet(null);
    plStop(); PL.offset = 0;
    const ed = { rec, orig: null, clean: null, proc: null, sr: rec.sampleRate, ver: 'final', peaks: {}, morph: null, busy: false };
    state.editor = ed;
    const el = $('#editor'); el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); document.body.classList.add('ed-open');
    renderEditorHead(); renderEditorPanels();
    $('#edWave').getContext('2d').clearRect(0, 0, 9999, 9999);
    const o = await loadSamples(id + '.orig'); if (!o || state.editor !== ed) { if (!o) toast('This recording\'s audio is missing', 'x'); return; }
    ed.orig = o.samples; ed.sr = o.sampleRate;
    if (rec.cleaned) { const c = await loadSamples(id + '.clean'); if (c) ed.clean = c.samples; else rec.cleaned = null; }
    if (rec.hasProc) { const p = await loadSamples(id + '.proc'); if (p) ed.proc = p.samples; else rec.hasProc = false; }
    ed.ver = (ed.clean || ed.proc) ? 'final' : 'orig';
    setBuffer(edSamples(ed, ed.ver), ed.sr); renderAB(); renderEditorPanels(); timeUI(); drawEditor();
  }
  function closeEditor() {
    plStop(); PL.buf = null; state.editor = null;
    const el = $('#editor'); el.classList.add('closing'); el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); document.body.classList.remove('ed-open');
    setTimeout(() => el.classList.remove('closing'), 560);
    renderLists();
  }
  function renderEditorHead() {
    const r = state.editor.rec;
    $('#edName').textContent = r.name;
    $('#edFolder').innerHTML = `${ic('folder')}${esc(folderName(r.folderId))}${ic('down')}`;
  }
  function renderAB() {
    const ed = state.editor, has = !!(ed.clean || ed.proc);
    $('#abSeg').hidden = !has; $('#abLabel').textContent = has ? 'Compare' : (ed.rec.isSample ? 'Demo clip' : 'Original');
    if (has) setSeg($('#abSeg'), ed.ver);
  }
  function renderEditorPanels() {
    const ed = state.editor; if (!ed) return; const r = ed.rec;
    setSeg($('#strengthSeg'), r.cleaned ? r.cleaned.strength : state.meta.settings.strength);
    const tag = $('#cleanTag');
    if (r.cleaned) { tag.className = 'tag good'; tag.textContent = r.cleaned.noiseDb ? `Noise −${r.cleaned.noiseDb} dB` : 'Cleaned'; }
    else { tag.className = 'tag'; tag.textContent = 'Not cleaned'; }
    $('#cleanLabel').textContent = r.cleaned ? 'Clean again' : 'Clean audio';
    const fine = $('#cleanFine'), left = Math.max(0, FREE_LIMIT - state.meta.freeUsed), cost = Math.ceil(r.duration);
    if (state.pro) fine.innerHTML = 'Pro: unlimited cleaning.';
    else if (r.isSample) fine.innerHTML = 'The demo sample is free to clean.';
    else if (r.freeCharged) fine.innerHTML = 'Already counted. Re-cleaning this one is free.';
    else if (cost <= left) fine.innerHTML = `Uses <b>${cost}s</b> of your <b>${left}s</b> free cleaning.`;
    else fine.innerHTML = `This clip is <b>${fmt(cost)}</b>. You have <b>${left}s</b> free left. Pro removes the limit.`;
    $('#fxGrid').innerHTML = E.EFFECTS.map(f => `<button class="fx" data-fx="${f.id}" aria-pressed="${(r.effect || 'none') === f.id}">${ic('fx_' + f.id)}<span>${esc(f.name)}</span>${f.pro && !state.pro ? ic('lock', 'lock') : ''}</button>`).join('');
    $('#pitch').value = r.pitch || 0; $('#pitchOut').textContent = (r.pitch > 0 ? '+' : '') + (r.pitch || 0);
    setSeg($('#fmtSeg'), state.meta.settings.format); setSeg($('#kbpsSeg'), state.meta.settings.kbps);
    $('#kbpsSeg').hidden = state.meta.settings.format !== 'mp3';
    $('#exportLabel').textContent = `Export ${state.meta.settings.format.toUpperCase()}`;
    $('#exportFine').textContent = (ed.clean || ed.proc) ? 'Exports the cleaned version with your effects.' : 'Exports the original. Clean it first for the best sound.';
  }
  function wavePeaks(samples, n) {
    const out = new Float32Array(n), step = samples.length / n;
    for (let i = 0; i < n; i++) { let p = 0; const a = Math.floor(i * step), b = Math.min(samples.length, Math.floor((i + 1) * step)); for (let j = a; j < b; j++) { const v = Math.abs(samples[j]); if (v > p) p = v; } out[i] = p; }
    let mx = 0; for (const v of out) mx = Math.max(mx, v); const g = mx > 0 ? Math.min(1 / mx, 6) : 1; for (let i = 0; i < n; i++) out[i] = Math.min(1, out[i] * g);
    return out;
  }
  function drawEditor() {
    const ed = state.editor, c = $('#edWave'); if (!ed || !ed.orig || !c.clientWidth) return;
    const { g, w, h } = fitCanvas(c); g.clearRect(0, 0, w, h);
    const bw = 2.5, gap = 1.6, n = Math.floor(w / (bw + gap));
    const key = ed.ver + ':' + n + ':' + (ed.proc ? 'p' : '') + (ed.clean ? 'c' : '');
    if (!ed.peaks[key]) ed.peaks[key] = wavePeaks(edSamples(ed, ed.ver), n);
    let pk = ed.peaks[key];
    if (ed.morph) {
      const t = clamp((performance.now() - ed.morph.t0) / 900, 0, 1), from = ed.morph.from; const mix = new Float32Array(n);
      for (let i = 0; i < n; i++) { const local = clamp(t * 1.5 - (i / n) * 0.5, 0, 1), e = 1 - Math.pow(1 - local, 3); mix[i] = (from[i] || 0) + (pk[i] - (from[i] || 0)) * e; }
      pk = mix; if (t >= 1) ed.morph = null; else requestAnimationFrame(drawEditor);
    }
    const dur = PL.buf ? PL.buf.duration : 1, prog = clamp(plPos() / dur, 0, 1), px = prog * w;
    const grad = g.createLinearGradient(0, 0, w, 0); grad.addColorStop(0, '#1ed68a'); grad.addColorStop(1, '#d6ff3f');
    const rest = ed.ver === 'orig' && (ed.clean || ed.proc) ? '#4a3d3b' : '#2a2f33';
    for (let i = 0; i < n; i++) {
      const x = i * (bw + gap), bh = Math.max(2, pk[i] * h * 0.92);
      g.fillStyle = x < px ? grad : rest;
      g.beginPath(); g.roundRect ? g.roundRect(x, (h - bh) / 2, bw, bh, 1.2) : g.rect(x, (h - bh) / 2, bw, bh); g.fill();
    }
    if (prog > 0) { g.fillStyle = '#eeeae2'; g.fillRect(Math.min(px, w - 2), 0, 2, h); }
  }
  function startMorph(fromVer) {
    const ed = state.editor, c = $('#edWave'); const n = Math.floor(c.clientWidth / 4.1);
    ed.morph = { from: wavePeaks(edSamples(ed, fromVer), n), t0: performance.now() }; drawEditor();
  }
  function switchVer(v) {
    const ed = state.editor; if (!ed || ed.ver === v) return;
    const from = ed.ver; ed.ver = v; setBuffer(edSamples(ed, v), ed.sr); setSeg($('#abSeg'), v);
    if (!reduceMotion) startMorph(from); else drawEditor();
  }
  function noiseDrop(a, b, sr) {
    const ratio = x => { const bl = Math.round(sr * 0.05), lv = []; for (let i = 0; i + bl <= x.length; i += bl) lv.push(E.rms(x.subarray(i, i + bl))); lv.sort((p, q) => p - q); if (lv.length < 5) return 0; const lo = lv[Math.floor(lv.length * 0.1)] + 1e-7, hi = lv[Math.floor(lv.length * 0.9)] + 1e-7; return 20 * Math.log10(hi / lo); };
    return Math.max(0, Math.round(ratio(b) - ratio(a)));
  }
  async function doClean() {
    const ed = state.editor; if (!ed || !ed.orig || ed.busy) return; const r = ed.rec;
    const charge = !state.pro && !r.isSample && !r.freeCharged, cost = Math.ceil(r.duration);
    if (charge && state.meta.freeUsed + cost > FREE_LIMIT) {
      const left = Math.max(0, FREE_LIMIT - state.meta.freeUsed);
      const got = await paywall(left > 0 ? `This clip is ${fmt(cost)} long and you have ${left}s of free cleaning left.` : 'You\'ve used your 30 free seconds of cleaning.');
      if (!got) return;
    }
    ed.busy = true; plPause();
    const btn = $('#cleanBtn'), prog = $('#cleanProg'), scan = $('#scan'), card = $('.wave-card'), canvas = $('#edWave');
    btn.disabled = true; btn.classList.add('busy'); $('#cleanLabel').textContent = 'Cleaning'; scan.classList.add('on');
    const wrapLeft = canvas.offsetLeft, cw = canvas.clientWidth;
    const strength = segValue($('#strengthSeg')) || 'medium', fromVer = ed.ver;
    try {
      const y = await E.denoise(ed.orig, ed.sr, {
        strength, onProgress: p => { prog.style.width = (p * 100) + '%'; scan.style.left = (wrapLeft + p * cw) + 'px'; }
      });
      ed.clean = y; r.cleaned = { strength, noiseDb: noiseDrop(ed.orig, y, ed.sr) };
      await P.putAudio(r.id + '.clean', E.encodeWAV(y, ed.sr));
      if ((r.effect && r.effect !== 'none') || r.pitch) { ed.proc = await E.applyEffect(y, ed.sr, r.effect || 'none', { pitch: r.pitch || 0 }); await P.putAudio(r.id + '.proc', E.encodeWAV(ed.proc, ed.sr)); r.hasProc = true; }
      if (charge) { state.meta.freeUsed += cost; r.freeCharged = true; }
      r.peaks = E.peaks(edSamples(ed, 'final'), 36);
      await saveMeta();
      ed.peaks = {}; ed.ver = 'final'; setBuffer(edSamples(ed, 'final'), ed.sr);
      renderAB(); renderEditorPanels(); renderPlan(); renderLists();
      if (!reduceMotion) startMorph(fromVer); else drawEditor();
      const br = btn.getBoundingClientRect(); burst(br.left + br.width / 2, br.top + br.height / 2);
      btn.classList.remove('shine'); void btn.offsetWidth; btn.classList.add('shine');
      toast(r.cleaned.noiseDb ? `Cleaned · background noise down ${r.cleaned.noiseDb} dB` : 'Cleaned', 'star4');
    } catch (e) { console.error(e); toast('Cleaning failed. Try again.', 'x'); }
    finally {
      ed.busy = false; btn.disabled = false; btn.classList.remove('busy'); prog.style.width = '0'; scan.classList.remove('on');
      renderEditorPanels();
    }
  }
  let fxBusy = false;
  async function applyFx(fxId, pitch) {
    const ed = state.editor; if (!ed || !ed.orig || fxBusy) return; const r = ed.rec;
    const f = E.EFFECTS.find(x => x.id === fxId);
    if (f && f.pro && !state.pro) { const got = await paywall(`${f.name} is a Pro effect.`); if (!got) return; }
    fxBusy = true; const base = ed.clean || ed.orig, fromVer = ed.ver;
    $$('.fx').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fx === fxId)));
    try {
      if (fxId === 'none' && !pitch) { ed.proc = null; r.hasProc = false; await P.deleteAudio(r.id + '.proc'); }
      else { ed.proc = await E.applyEffect(base, ed.sr, fxId, { pitch }); await P.putAudio(r.id + '.proc', E.encodeWAV(ed.proc, ed.sr)); r.hasProc = true; }
      r.effect = fxId; r.pitch = pitch; r.peaks = E.peaks(edSamples(ed, 'final'), 36);
      await saveMeta(); ed.peaks = {};
      ed.ver = (ed.clean || ed.proc) ? 'final' : 'orig';
      setBuffer(edSamples(ed, ed.ver), ed.sr); renderAB(); renderEditorPanels();
      if (!reduceMotion) startMorph(fromVer); else drawEditor();
      if (!PL.playing) { PL.offset = 0; plPlay(); }
    } catch (e) { console.error(e); toast('That effect failed. Try again.', 'x'); }
    finally { fxBusy = false; }
  }
  async function doExport() {
    const ed = state.editor; if (!ed || !ed.orig) return; const r = ed.rec, s = state.meta.settings;
    const btn = $('#exportBtn'); btn.disabled = true; $('#exportLabel').textContent = 'Preparing'; btn.classList.add('busy');
    try {
      const data = edSamples(ed, 'final');
      const bytes = s.format === 'mp3' ? await E.encodeMP3(data, ed.sr, s.kbps) : E.encodeWAV(data, ed.sr);
      const name = `${safeFile(r.name)}${(ed.clean || ed.proc) ? ' (clear)' : ''}.${s.format}`;
      const res = await P.exportFile(name, bytes, s.format === 'mp3' ? 'audio/mpeg' : 'audio/wav');
      if (res.ok) {
        toast(res.note || `Exported ${s.format.toUpperCase()} · ${(bytes.length / 1048576).toFixed(1)} MB`, 'share');
        if (!state.pro) setTimeout(() => P.ads.interstitial(), res.note ? 2400 : 600);
      } else if (!res.quiet) toast(res.message || 'Export failed', 'x');
    } catch (e) { console.error(e); toast(String(e.message || e).includes('MP3') ? 'MP3 encoder didn\'t load. Try WAV.' : 'Export failed', 'x'); }
    finally { btn.disabled = false; btn.classList.remove('busy'); renderEditorPanels(); }
  }

  /* ---------- Sparkle burst ---------- */
  function burst(x, y) {
    if (reduceMotion) return;
    const c = document.createElement('canvas'); c.className = 'burst'; document.body.appendChild(c);
    const { g, w, h } = (() => { const dpr = Math.min(2, devicePixelRatio || 1); c.width = innerWidth * dpr; c.height = innerHeight * dpr; const g = c.getContext('2d'); g.scale(dpr, dpr); return { g, w: innerWidth, h: innerHeight }; })();
    const cols = ['#d6ff3f', '#1ed68a', '#eeeae2', '#e2ff6e'];
    const ps = Array.from({ length: 34 }, (_, i) => { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 5.5; return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, s: 3 + Math.random() * 6, c: cols[i % 4], star: i % 3 === 0, r: Math.random() * 6 }; });
    const t0 = performance.now();
    const star = (px, py, s) => { g.beginPath(); for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, rr = k % 2 ? s * 0.28 : s; g.lineTo(px + Math.cos(ang) * rr, py + Math.sin(ang) * rr); } g.closePath(); g.fill(); };
    const step = now => {
      const t = (now - t0) / 1000; g.clearRect(0, 0, w, h);
      for (const p of ps) { p.vy += 0.16; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; g.globalAlpha = Math.max(0, 1 - t / 1.1); g.fillStyle = p.c; if (p.star) star(p.x, p.y, p.s); else { g.beginPath(); g.arc(p.x, p.y, p.s / 3, 0, 7); g.fill(); } }
      if (t < 1.1) requestAnimationFrame(step); else c.remove();
    };
    requestAnimationFrame(step);
  }

  /* ---------- Back button (Android) ---------- */
  function onBack() {
    if (!$('#interstitial').hidden) return true;
    if (sheetOpen()) { closeSheet(null); return true; }
    if (state.editor) { closeEditor(); return true; }
    if (R.status !== 'idle') { discardRec(); return true; }
    if (state.view !== 'record') { go('record'); return true; }
    return false;
  }
  window.ClearApp = { onBack };

  /* ---------- Wire up ---------- */
  function bind() {
    $$('[data-ic]').forEach(el => { el.outerHTML = ic(el.dataset.ic, el.className); });
    $$('.tab').forEach(t => t.onclick = () => go(t.dataset.go));
    $$('[data-goto]').forEach(b => b.onclick = () => go(b.dataset.goto));
    $('#planChip').onclick = () => state.pro ? go('settings') : paywall();
    $('#recBtn').onclick = () => R.status === 'idle' ? startRec() : stopRec(true);
    $('#recPause').onclick = togglePause;
    $('#recDiscard').onclick = discardRec;
    $('#importBtn').onclick = () => $('#fileInput').click();
    $('#libImport').onclick = () => $('#fileInput').click();
    $('#fileInput').onchange = e => { const f = Array.from(e.target.files || []); e.target.value = ''; if (f.length) importFiles(f); };
    $('#sampleBtn').onclick = trySample;
    $('#scrim').onclick = () => closeSheet(null);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') onBack(); });
    // lists (event delegation)
    document.addEventListener('click', e => {
      const o = e.target.closest('[data-open]'); if (o) { openEditor(o.dataset.open); return; }
      const m = e.target.closest('[data-menu]'); if (m) { itemMenu(m.dataset.menu); return; }
      const f = e.target.closest('[data-folder]'); if (f) { state.folder = f.dataset.folder; renderLibrary(); return; }
      if (e.target.closest('#chipAdd')) { createFolder().then(fo => { if (fo) { state.folder = fo.id; renderLibrary(); } }); }
    });
    $('#newFolderBtn').onclick = () => createFolder().then(fo => { if (fo) { state.folder = fo.id; renderLibrary(); } });
    $('#folderMenu').onclick = folderMenu;
    $('#search').oninput = e => { state.search = e.target.value; renderLibrary(); };
    $('#sortSel').onchange = e => { state.sort = e.target.value; renderLibrary(); };
    // settings
    $('#setStrength').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.meta.settings.strength = b.dataset.v; setSeg($('#setStrength'), b.dataset.v); saveMeta(); };
    $('#setFormat').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.meta.settings.format = b.dataset.v; setSeg($('#setFormat'), b.dataset.v); saveMeta(); };
    $('#setKbps').onchange = e => { state.meta.settings.kbps = +e.target.value; saveMeta(); };
    $('#restoreBtn').onclick = async () => { const r = await P.billing.restore(); if (r.pro && !state.pro) becomePro(); else toast(r.pro ? 'Pro is already active' : 'No active subscription found', r.pro ? 'check' : 'x'); };
    $('#resetBtn').onclick = async () => {
      const ok = await confirmSheet({ title: 'Reset the preview?', sub: 'Deletes every recording and folder in this preview and restores the 30 free seconds.', confirm: 'Reset everything', danger: true });
      if (!ok) return; for (const r of state.meta.recordings.slice()) await removeRecording(r.id);
      state.meta = freshMeta(); state.pro = false; await seed(); await saveMeta(); P.ads.showBanner(); renderPlan(); renderLists(); renderSettings(); toast('Preview reset');
    };
    // editor
    $('#edBack').onclick = closeEditor;
    $('#edName').onclick = () => renameRec(state.editor.rec);
    $('#edFolder').onclick = () => moveRec(state.editor.rec);
    $('#edMore').onclick = async () => {
      const r = state.editor.rec;
      const v = await actionSheet(r.name, [{ icon: 'edit', label: 'Rename', value: 'rename' }, { icon: 'move', label: 'Move to folder', value: 'move' },
        ...(r.cleaned || r.hasProc ? [{ icon: 'restore', label: 'Revert to original', value: 'revert' }] : []), { icon: 'trash', label: 'Delete', value: 'delete', danger: true }]);
      if (v === 'rename') renameRec(r); if (v === 'move') moveRec(r); if (v === 'delete') deleteRec(r);
      if (v === 'revert') {
        const ed = state.editor; await Promise.all([P.deleteAudio(r.id + '.clean'), P.deleteAudio(r.id + '.proc')]);
        r.cleaned = null; r.hasProc = false; r.effect = 'none'; r.pitch = 0; r.peaks = E.peaks(ed.orig, 36); ed.clean = ed.proc = null; ed.peaks = {};
        const from = ed.ver; ed.ver = 'orig'; setBuffer(ed.orig, ed.sr); await saveMeta(); renderAB(); renderEditorPanels(); renderLists(); if (!reduceMotion) startMorph(from === 'orig' ? 'final' : from); else drawEditor(); toast('Back to the original', 'restore');
      }
    };
    $('#playBtn').onclick = () => PL.playing ? plPause() : plPlay();
    $('#back5').onclick = () => plSeek(plPos() - 5);
    $('#fwd5').onclick = () => plSeek(plPos() + 5);
    const wave = $('#edWave');
    const seekAt = e => { const rect = wave.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width; if (PL.buf) plSeek(x * PL.buf.duration); };
    let dragging = false;
    wave.addEventListener('pointerdown', e => { dragging = true; wave.setPointerCapture(e.pointerId); seekAt(e); });
    wave.addEventListener('pointermove', e => { if (dragging) seekAt(e); });
    wave.addEventListener('pointerup', () => dragging = false);
    $('#abSeg').onclick = e => { const b = e.target.closest('button'); if (b) switchVer(b.dataset.v); };
    $('#strengthSeg').onclick = e => { const b = e.target.closest('button'); if (b) setSeg($('#strengthSeg'), b.dataset.v); };
    $('#cleanBtn').onclick = doClean;
    $('#fxGrid').onclick = e => { const b = e.target.closest('[data-fx]'); if (b) applyFx(b.dataset.fx, +$('#pitch').value); };
    $('#pitch').oninput = e => { const v = +e.target.value; $('#pitchOut').textContent = (v > 0 ? '+' : '') + v; };
    $('#pitch').onchange = e => applyFx(state.editor.rec.effect || 'none', +e.target.value);
    $('#fmtSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.meta.settings.format = b.dataset.v; saveMeta(); renderEditorPanels(); };
    $('#kbpsSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.meta.settings.kbps = +b.dataset.v; saveMeta(); setSeg($('#kbpsSeg'), b.dataset.v); };
    $('#exportBtn').onclick = doExport;
    window.addEventListener('resize', () => { if (state.editor) { state.editor.peaks = {}; drawEditor(); } drawLive(); });
  }

  async function seed() {
    if (state.meta.seeded) return;
    state.meta.seeded = true;
    const vn = { id: uid(), name: 'Voice notes', createdAt: Date.now() }, pod = { id: uid(), name: 'Podcast', createdAt: Date.now() };
    state.meta.folders.push(vn, pod);
    const { mixed } = E.demoClip(44100, 6);
    await addRecording({ samples: mixed, sr: 44100, name: 'Sample · noisy room (demo)', folderId: vn.id, isSample: true });
  }

  async function boot() {
    bind();
    const t0 = performance.now();
    try { await P.init(); } catch (e) { console.warn(e); }
    let meta = null; try { meta = await P.loadMeta(); } catch (e) { }
    state.meta = Object.assign(freshMeta(), meta || {}); state.meta.settings = Object.assign(freshMeta().settings, state.meta.settings || {});
    await seed();
    try { await P.billing.init(); state.pro = await P.billing.isPro(); } catch (e) { state.pro = false; }
    try { await P.ads.init(); if (!state.pro) await P.ads.showBanner(); } catch (e) { }
    renderPlan(); renderRecent(); setRecUI();
    ['#strengthSeg', '#fmtSeg', '#kbpsSeg', '#setStrength', '#setFormat'].forEach(s => setSeg($(s), segValue($(s)) || $('button', $(s)).dataset.v));
    drawLive(); idleLoop(); moveTabPill();
    const hero = $('#recStage'), btn = $('#recBtn');
    createDither($('#recDither'), {
      cell: 6, bg: [0.067, 0.075, 0.082],
      focus: () => { const a = hero.getBoundingClientRect(), b = btn.getBoundingClientRect(); if (!a.width) return null; return { x: (b.left + b.width / 2 - a.left) / a.width, y: 1 - (b.top + b.height / 2 - a.top) / a.height }; },
      boost: () => liveLevel,
      active: () => state.view === 'record' && !state.editor,
    });
    const splashD = createDither($('#splashDither'), { cell: 7, focus: () => ({ x: 0.5, y: 0.42 }), active: () => !$('#splash').classList.contains('out') });
    const wait = Math.max(0, 1500 - (performance.now() - t0));
    setTimeout(() => { $('#splash').classList.add('out'); $('#view-record').classList.add('enter'); setTimeout(() => splashD && splashD.stop(), 800); }, reduceMotion ? 0 : wait);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
