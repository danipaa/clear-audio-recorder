/* Clear Audio Recorder — audio engine
 * Pure JavaScript DSP: noise removal, voice effects, WAV/MP3 encoding.
 * Runs fully on the device. No servers, no paid APIs.
 * Works in the browser (window.ClearEngine) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';

  const yieldToUI = () => new Promise(r => setTimeout(r, 0));

  /* ---------- FFT (radix-2, in place) ---------- */
  function makeFFT(n) {
    const levels = Math.log2(n) | 0;
    if (1 << levels !== n) throw new Error('FFT size must be a power of 2');
    const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2);
    for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = Math.sin(2 * Math.PI * i / n); }
    const rev = new Uint32Array(n);
    for (let i = 0; i < n; i++) { let x = i, y = 0; for (let j = 0; j < levels; j++) { y = (y << 1) | (x & 1); x >>>= 1; } rev[i] = y; }
    function transform(re, im, inverse) {
      for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
      const s = inverse ? -1 : 1;
      for (let size = 2; size <= n; size <<= 1) {
        const half = size >>> 1, step = n / size;
        for (let i = 0; i < n; i += size) {
          for (let j = i, k = 0; j < i + half; j++, k += step) {
            const l = j + half;
            const tre = re[l] * cos[k] + s * im[l] * sin[k];
            const tim = -s * re[l] * sin[k] + im[l] * cos[k];
            re[l] = re[j] - tre; im[l] = im[j] - tim;
            re[j] += tre; im[j] += tim;
          }
        }
      }
      if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
    }
    return transform;
  }

  /* ---------- Helpers ---------- */
  function toMono(channels) {
    if (channels.length === 1) return Float32Array.from(channels[0]);
    const n = channels[0].length, out = new Float32Array(n);
    for (const ch of channels) for (let i = 0; i < n; i++) out[i] += ch[i] / channels.length;
    return out;
  }
  const dbToGain = db => Math.pow(10, db / 20);
  function rms(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, x.length)); }
  function peak(x) { let p = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > p) p = a; } return p; }

  /* ---------- Biquad filters (RBJ cookbook) ---------- */
  function biquad(type, freq, sr, q = 0.707, gainDb = 0) {
    const w = 2 * Math.PI * Math.min(freq, sr * 0.49) / sr, cw = Math.cos(w), sw = Math.sin(w);
    const alpha = sw / (2 * q), A = Math.pow(10, gainDb / 40);
    let b0, b1, b2, a0, a1, a2;
    switch (type) {
      case 'lowpass': b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
      case 'highpass': b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
      case 'bandpass': b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; break;
      case 'peaking': b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A; break;
      case 'lowshelf': { const sa = 2 * Math.sqrt(A) * alpha;
        b0 = A * ((A + 1) - (A - 1) * cw + sa); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - sa);
        a0 = (A + 1) + (A - 1) * cw + sa; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - sa; break; }
      case 'highshelf': { const sa = 2 * Math.sqrt(A) * alpha;
        b0 = A * ((A + 1) + (A - 1) * cw + sa); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - sa);
        a0 = (A + 1) - (A - 1) * cw + sa; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - sa; break; }
      default: throw new Error('unknown filter ' + type);
    }
    return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
  }
  function applyBiquad(x, f) {
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = f.b0 * x[i] + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  }
  const filt = (x, sr, type, freq, q, gain) => applyBiquad(x, biquad(type, freq, sr, q, gain));

  /* ---------- Dynamics ---------- */
  function compress(x, sr, { threshold = -20, ratio = 3, attack = 0.005, release = 0.12, makeup = 0 } = {}) {
    const y = new Float32Array(x.length);
    const ga = Math.exp(-1 / (attack * sr)), gr = Math.exp(-1 / (release * sr));
    let env = 0; const mk = dbToGain(makeup);
    for (let i = 0; i < x.length; i++) {
      const a = Math.abs(x[i]);
      env = a > env ? ga * env + (1 - ga) * a : gr * env + (1 - gr) * a;
      const lvl = 20 * Math.log10(env + 1e-9);
      const over = lvl - threshold;
      const gainDb = over > 0 ? -over * (1 - 1 / ratio) : 0;
      y[i] = x[i] * dbToGain(gainDb) * mk;
    }
    return y;
  }
  function softLimit(x, ceilingDb = -1) {
    const c = dbToGain(ceilingDb), y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) y[i] = c * Math.tanh(x[i] / c);
    return y;
  }
  /* Bring speech to a consistent loudness, then keep peaks under -1 dBFS. */
  function levelVoice(x, sr, targetDb = -17) {
    // RMS of the loud parts only (ignore silence)
    const block = Math.round(sr * 0.05), levels = [];
    for (let i = 0; i + block <= x.length; i += block) levels.push(rms(x.subarray(i, i + block)));
    levels.sort((a, b) => a - b);
    const loud = levels.length ? levels[Math.floor(levels.length * 0.85)] : rms(x);
    if (loud < 1e-5) return x;
    const g = Math.min(dbToGain(targetDb) / loud, dbToGain(24));
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) y[i] = x[i] * g;
    return softLimit(compress(y, sr, { threshold: targetDb + 4, ratio: 2.5 }), -1);
  }

  /* ---------- Noise removal: spectral gating ----------
   * 1. Cut rumble below 75 Hz.
   * 2. Learn the noise fingerprint of every frequency band from the quietest
   *    moments of the clip (no "noise-only" sample needed).
   * 3. Turn each band down whenever it is close to the noise level, with smooth
   *    gain changes so the result has no warbly "musical noise".
   * 4. Level the voice so it sounds close and even.
   */
  const STRENGTH = {
    light:  { over: 1.0, floorDb: -16, smoothT: 0.55 },
    medium: { over: 1.3, floorDb: -26, smoothT: 0.6 },
    strong: { over: 1.7, floorDb: -34, smoothT: 0.65 },
  };

  async function denoise(input, sr, { strength = 'medium', onProgress, polish = true } = {}) {
    const cfg = STRENGTH[strength] || STRENGTH.medium;
    let x = filt(input, sr, 'highpass', 75, 0.707);

    const N = sr > 32000 ? 2048 : 1024, H = N / 4, bins = N / 2 + 1;
    const fft = makeFFT(N);
    const win = new Float32Array(N);
    for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);

    // pad so every sample is covered by full overlap
    const padded = new Float32Array(x.length + 2 * N);
    padded.set(x, N);
    const frames = Math.floor((padded.length - N) / H) + 1;
    const re = new Float64Array(N), im = new Float64Array(N);

    // Pass 1: noise fingerprint from up to 1200 evenly spaced frames
    const sampleCount = Math.min(frames, 1200), stride = frames / sampleCount;
    const mags = new Float32Array(sampleCount * bins);
    const frameEnergy = new Float32Array(sampleCount);
    for (let s = 0; s < sampleCount; s++) {
      const off = Math.floor(s * stride) * H;
      for (let i = 0; i < N; i++) { re[i] = padded[off + i] * win[i]; im[i] = 0; }
      fft(re, im, false);
      let e = 0;
      for (let k = 0; k < bins; k++) { const m = Math.hypot(re[k], im[k]); mags[s * bins + k] = m; e += m * m; }
      frameEnergy[s] = e;
    }
    // quietest 15% of non-silent frames = the noise floor
    const order = Array.from(frameEnergy.keys()).filter(i => frameEnergy[i] > 1e-12).sort((a, b) => frameEnergy[a] - frameEnergy[b]);
    const quiet = order.slice(0, Math.max(4, Math.floor(order.length * 0.15)));
    const noiseMean = new Float64Array(bins), noiseStd = new Float64Array(bins);
    for (const f of quiet) for (let k = 0; k < bins; k++) noiseMean[k] += mags[f * bins + k] / quiet.length;
    for (const f of quiet) for (let k = 0; k < bins; k++) { const d = mags[f * bins + k] - noiseMean[k]; noiseStd[k] += d * d / quiet.length; }
    const thresh = new Float64Array(bins);
    for (let k = 0; k < bins; k++) thresh[k] = (noiseMean[k] + 1.0 * Math.sqrt(noiseStd[k])) * cfg.over;

    // Pass 2: gate + resynthesis
    const out = new Float32Array(padded.length), norm = new Float32Array(padded.length);
    const floor = dbToGain(cfg.floorDb);
    const prevGain = new Float64Array(bins).fill(1);
    const g = new Float64Array(bins), gs = new Float64Array(bins);
    let lastYield = Date.now();
    for (let f = 0; f < frames; f++) {
      const off = f * H;
      for (let i = 0; i < N; i++) { re[i] = padded[off + i] * win[i]; im[i] = 0; }
      fft(re, im, false);
      for (let k = 0; k < bins; k++) {
        const m = Math.hypot(re[k], im[k]);
        // soft Wiener-style gain, clamped to the floor
        const r = thresh[k] / (m + 1e-12);
        g[k] = Math.max(floor, Math.min(1, 1 - r * r));
      }
      // smooth across neighbouring frequencies
      for (let k = 0; k < bins; k++) {
        const a = g[Math.max(0, k - 2)], b = g[Math.max(0, k - 1)], c = g[k], d = g[Math.min(bins - 1, k + 1)], e = g[Math.min(bins - 1, k + 2)];
        gs[k] = (a + 2 * b + 3 * c + 2 * d + e) / 9;
      }
      // smooth over time: open fast, close gently
      for (let k = 0; k < bins; k++) {
        const target = gs[k];
        const coef = target > prevGain[k] ? 0.25 : cfg.smoothT;
        const v = coef * prevGain[k] + (1 - coef) * target;
        prevGain[k] = v;
        re[k] *= v; im[k] *= v;
        if (k > 0 && k < N / 2) { re[N - k] = re[k]; im[N - k] = -im[k]; }
      }
      fft(re, im, true);
      for (let i = 0; i < N; i++) { out[off + i] += re[i] * win[i]; norm[off + i] += win[i] * win[i]; }
      if (Date.now() - lastYield > 40) {
        if (onProgress) onProgress(0.05 + 0.85 * f / frames);
        await yieldToUI(); lastYield = Date.now();
      }
    }
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) { const n = norm[i + N]; y[i] = n > 1e-6 ? out[i + N] / n : 0; }
    if (onProgress) onProgress(0.95);
    if (!polish) return y;
    // gentle presence lift so voices sound crisp after cleaning
    let z = filt(y, sr, 'peaking', 3200, 0.9, 2);
    z = levelVoice(z, sr);
    if (onProgress) onProgress(1);
    return z;
  }

  /* ---------- Voice effects ---------- */
  // Two-tap delay-line pitch shifter with equal-power crossfade
  function pitchShift(x, sr, semitones) {
    if (!semitones) return Float32Array.from(x);
    const ratio = Math.pow(2, semitones / 12);
    const W = Math.round(sr * 0.06), y = new Float32Array(x.length);
    let phase = 0; const inc = (1 - ratio) / W;
    for (let i = 0; i < x.length; i++) {
      phase += inc; phase -= Math.floor(phase);
      for (let t = 0; t < 2; t++) {
        const p = (phase + t * 0.5) % 1;
        const d = p * W, pos = i - d;
        const i0 = Math.floor(pos), fr = pos - i0;
        const s0 = i0 >= 0 && i0 < x.length ? x[i0] : 0, s1 = i0 + 1 >= 0 && i0 + 1 < x.length ? x[i0 + 1] : 0;
        y[i] += (s0 + (s1 - s0) * fr) * Math.sin(Math.PI * p);
      }
    }
    return y;
  }
  function ringMod(x, sr, freq, mix = 1) {
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) y[i] = x[i] * (1 - mix + mix * Math.sin(2 * Math.PI * freq * i / sr));
    return y;
  }
  function echo(x, sr, time, feedback, mix) {
    const d = Math.round(time * sr), tail = Math.round(d * Math.log(0.001) / Math.log(feedback));
    const n = x.length + Math.min(tail, sr * 4), buf = new Float32Array(n), y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const dry = i < x.length ? x[i] : 0;
      const wet = i >= d ? buf[i - d] : 0;
      buf[i] = dry + wet * feedback;
      y[i] = dry + wet * mix;
    }
    return y;
  }
  function comb(x, delaySamples, feedback, damp) {
    const y = new Float32Array(x.length), b = new Float32Array(delaySamples); let idx = 0, store = 0;
    for (let i = 0; i < x.length; i++) {
      const out = b[idx]; store = out * (1 - damp) + store * damp;
      b[idx] = x[i] + store * feedback; idx = (idx + 1) % delaySamples; y[i] = out;
    }
    return y;
  }
  function allpass(x, delaySamples, feedback = 0.5) {
    const y = new Float32Array(x.length), b = new Float32Array(delaySamples); let idx = 0;
    for (let i = 0; i < x.length; i++) {
      const bo = b[idx]; y[i] = -x[i] + bo; b[idx] = x[i] + bo * feedback; idx = (idx + 1) % delaySamples;
    }
    return y;
  }
  // Freeverb-style room
  function reverb(x, sr, { size = 0.88, damp = 0.3, mix = 0.4, tailSec = 2.5 } = {}) {
    const n = x.length + Math.round(sr * tailSec), src = new Float32Array(n); src.set(x);
    const k = sr / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
    const wet = new Float32Array(n);
    for (const c of combs) { const o = comb(src, Math.round(c * k), size, damp); for (let i = 0; i < n; i++) wet[i] += o[i] * 0.12; }
    let w = wet; for (const a of aps) w = allpass(w, Math.round(a * k));
    const y = new Float32Array(n);
    for (let i = 0; i < n; i++) y[i] = src[i] * (1 - mix * 0.5) + w[i] * mix;
    return y;
  }
  function drive(x, amount) {
    const y = new Float32Array(x.length), k = amount;
    for (let i = 0; i < x.length; i++) y[i] = Math.tanh(x[i] * k) / Math.tanh(k);
    return y;
  }
  function vibrato(x, sr, rate = 5.5, depthSec = 0.003) {
    const y = new Float32Array(x.length), D = depthSec * sr;
    for (let i = 0; i < x.length; i++) {
      const pos = i - D * (1 + Math.sin(2 * Math.PI * rate * i / sr));
      const i0 = Math.floor(pos), fr = pos - i0;
      const s0 = i0 >= 0 ? x[i0] : 0, s1 = i0 + 1 >= 0 && i0 + 1 < x.length ? x[i0 + 1] : 0;
      y[i] = s0 + (s1 - s0) * fr;
    }
    return y;
  }

  const EFFECTS = [
    { id: 'none',      name: 'Original',  pro: false },
    { id: 'deep',      name: 'Deep',      pro: false },
    { id: 'chipmunk',  name: 'Chipmunk',  pro: false },
    { id: 'echo',      name: 'Echo',      pro: false },
    { id: 'robot',     name: 'Robot',     pro: true },
    { id: 'radio',     name: 'Radio',     pro: true },
    { id: 'telephone', name: 'Phone call',pro: true },
    { id: 'cave',      name: 'Cave',      pro: true },
    { id: 'monster',   name: 'Monster',   pro: true },
    { id: 'alien',     name: 'Alien',     pro: true },
    { id: 'stadium',   name: 'Stadium',   pro: true },
    { id: 'wobble',    name: 'Wobble',    pro: true },
  ];

  async function applyEffect(x, sr, id, { pitch = 0 } = {}) {
    await yieldToUI();
    let y = pitch ? pitchShift(x, sr, pitch) : x;
    switch (id) {
      case 'none': break;
      case 'deep': y = filt(pitchShift(y, sr, -5), sr, 'lowshelf', 180, 0.7, 4); break;
      case 'chipmunk': y = filt(pitchShift(y, sr, 7), sr, 'highpass', 150); break;
      case 'echo': y = echo(y, sr, 0.28, 0.42, 0.55); break;
      case 'robot': { y = ringMod(y, sr, 55, 0.85); y = comb(y, Math.round(sr * 0.009), 0.45, 0); y = filt(y, sr, 'peaking', 1500, 1, 4); break; }
      case 'radio': { y = filt(filt(y, sr, 'highpass', 450, 0.9), sr, 'lowpass', 3200, 0.9); y = drive(y, 3); break; }
      case 'telephone': { y = filt(filt(filt(y, sr, 'highpass', 320, 1.1), sr, 'lowpass', 3300, 1.1), sr, 'peaking', 1800, 1.2, 6); y = drive(y, 1.8); break; }
      case 'cave': y = reverb(y, sr, { size: 0.93, damp: 0.15, mix: 0.6, tailSec: 3.5 }); break;
      case 'monster': { y = drive(filt(pitchShift(y, sr, -9), sr, 'lowshelf', 200, 0.7, 6), 2.5); break; }
      case 'alien': { y = vibrato(ringMod(pitchShift(y, sr, 3), sr, 140, 0.5), sr, 7, 0.0025); break; }
      case 'stadium': { y = reverb(echo(y, sr, 0.42, 0.25, 0.35), sr, { size: 0.9, damp: 0.4, mix: 0.45, tailSec: 3 }); break; }
      case 'wobble': y = vibrato(y, sr, 6, 0.006); break;
      default: throw new Error('unknown effect ' + id);
    }
    // keep the output safe from clipping
    const p = peak(y);
    if (p > 0.98) { const g = 0.95 / p; const z = new Float32Array(y.length); for (let i = 0; i < y.length; i++) z[i] = y[i] * g; y = z; }
    return y;
  }

  /* ---------- Encoders ---------- */
  function floatTo16(x) {
    const out = new Int16Array(x.length);
    for (let i = 0; i < x.length; i++) { const s = Math.max(-1, Math.min(1, x[i])); out[i] = s < 0 ? s * 0x8000 : s * 0x7fff; }
    return out;
  }
  function encodeWAV(x, sr) {
    const pcm = floatTo16(x), buf = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
    new Int16Array(buf, 44).set(pcm);
    return new Uint8Array(buf);
  }
  function decodeWAV(bytes) {
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let off = 12, sr = 44100, ch = 1, bits = 16, data = null;
    while (off + 8 <= v.byteLength) {
      const id = String.fromCharCode(v.getUint8(off), v.getUint8(off + 1), v.getUint8(off + 2), v.getUint8(off + 3));
      const size = v.getUint32(off + 4, true);
      if (id === 'fmt ') { ch = v.getUint16(off + 10, true); sr = v.getUint32(off + 12, true); bits = v.getUint16(off + 22, true); }
      if (id === 'data') { data = { start: off + 8, size: Math.min(size, v.byteLength - off - 8) }; break; }
      off += 8 + size + (size & 1);
    }
    if (!data || bits !== 16) throw new Error('Unsupported WAV');
    const frames = Math.floor(data.size / (2 * ch)), out = new Float32Array(frames);
    for (let i = 0; i < frames; i++) { let s = 0; for (let c = 0; c < ch; c++) s += v.getInt16(data.start + (i * ch + c) * 2, true); out[i] = s / ch / 32768; }
    return { samples: out, sampleRate: sr };
  }
  const MP3_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];
  function resampleLinear(x, from, to) {
    if (from === to) return x;
    const n = Math.round(x.length * to / from), y = new Float32Array(n), r = from / to;
    for (let i = 0; i < n; i++) { const p = i * r, i0 = Math.floor(p), f = p - i0; y[i] = (x[i0] || 0) + ((x[i0 + 1] || 0) - (x[i0] || 0)) * f; }
    return y;
  }
  async function encodeMP3(x, sr, kbps = 192, lame) {
    lame = lame || root.lamejs;
    if (!lame) throw new Error('MP3 encoder not loaded');
    let rate = sr;
    if (!MP3_RATES.includes(rate)) { rate = 44100; x = resampleLinear(x, sr, rate); }
    const enc = new lame.Mp3Encoder(1, rate, kbps), pcm = floatTo16(x), parts = [];
    const block = 1152 * 20;
    for (let i = 0; i < pcm.length; i += block) {
      const b = enc.encodeBuffer(pcm.subarray(i, i + block)); if (b.length) parts.push(new Uint8Array(b));
      if (i % (block * 40) === 0) await yieldToUI();
    }
    const end = enc.flush(); if (end.length) parts.push(new Uint8Array(end));
    let len = 0; for (const p of parts) len += p.length;
    const out = new Uint8Array(len); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }

  /* ---------- Waveform peaks for drawing ---------- */
  function peaks(x, count = 120) {
    const out = new Array(count).fill(0), step = x.length / count;
    for (let i = 0; i < count; i++) {
      let p = 0; const a = Math.floor(i * step), b = Math.min(x.length, Math.floor((i + 1) * step));
      for (let j = a; j < b; j++) { const v = Math.abs(x[j]); if (v > p) p = v; }
      out[i] = Math.round(Math.min(1, p) * 1000) / 1000;
    }
    return out;
  }

  /* ---------- Demo clip: a synthetic "voice memo" recorded in a noisy room ---------- */
  function demoClip(sr = 44100, seconds = 6, seed = 7) {
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const n = Math.round(sr * seconds), voice = new Float32Array(n), noise = new Float32Array(n);
    // formant "vowels" (F1,F2,F3)
    const vowels = [[730, 1090, 2440], [270, 2290, 3010], [530, 1840, 2480], [300, 870, 2240], [660, 1720, 2410]];
    const syll = []; let t = 0.35;
    while (t < seconds - 0.4) { const d = 0.16 + rnd() * 0.18; syll.push({ t, d, v: vowels[Math.floor(rnd() * vowels.length)], f0: 120 + rnd() * 70 }); t += d + (rnd() < 0.25 ? 0.35 : 0.05); }
    const src = new Float32Array(n);
    for (const sy of syll) {
      const a = Math.round(sy.t * sr), b = Math.min(n, Math.round((sy.t + sy.d) * sr)); let ph = 0;
      for (let i = a; i < b; i++) {
        const u = (i - a) / (b - a), env = Math.sin(Math.PI * u) ** 0.6;
        const f0 = sy.f0 * (1 + 0.08 * Math.sin(2 * Math.PI * u));
        ph += f0 / sr; ph -= Math.floor(ph);
        src[i] += (2 * ph - 1) * env; // glottal sawtooth
      }
    }
    for (const sy of syll) {
      const a = Math.round(sy.t * sr), b = Math.min(n, Math.round((sy.t + sy.d) * sr));
      const seg = src.subarray(a, b);
      let v = new Float32Array(seg.length);
      for (let k = 0; k < 3; k++) { const f = applyBiquad(seg, biquad('bandpass', sy.v[k], sr, 6 + k * 2)); for (let i = 0; i < v.length; i++) v[i] += f[i] * [1, 0.6, 0.3][k]; }
      voice.set(v, a);
    }
    // room noise: hiss + fan rumble + mains hum
    let pink = 0, b1 = 0;
    for (let i = 0; i < n; i++) {
      const w = rnd() * 2 - 1; pink = 0.97 * pink + 0.03 * w; b1 = 0.995 * b1 + 0.005 * w;
      noise[i] = w * 0.018 + pink * 0.08 + b1 * 0.5 + 0.012 * Math.sin(2 * Math.PI * 50 * i / sr) + 0.006 * Math.sin(2 * Math.PI * 150 * i / sr);
    }
    const vp = peak(voice) || 1, out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = voice[i] / vp * 0.5 + noise[i];
    return { mixed: out, voice: voice.map(v => v / vp * 0.5), noise };
  }

  const api = { STRENGTH, denoise, applyEffect, pitchShift, encodeWAV, decodeWAV, encodeMP3, peaks, toMono, demoClip, EFFECTS, rms, peak, resampleLinear };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ClearEngine = api;
})(typeof self !== 'undefined' ? self : this);
