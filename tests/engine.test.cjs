// Audio engine checks. Run with: npm test
const assert = require('assert');
const vm = require('vm'), fs = require('fs');
const E = require('../src/engine.js');
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(require.resolve('lamejs/lame.min.js'), 'utf8'), ctx);
const lame = ctx.lamejs;
const sr = 44100;
const floorDb = (x, g = 1) => 20 * Math.log10(E.rms(x.subarray(0, Math.round(sr * 0.3))) / g + 1e-12);

(async () => {
  const { mixed, voice } = E.demoClip(sr, 6);
  const before = floorDb(mixed);
  for (const strength of ['light', 'medium', 'strong']) {
    const y = await E.denoise(mixed, sr, { strength, polish: false });
    assert.strictEqual(y.length, mixed.length, 'length changed');
    assert.ok(y.every(Number.isFinite), 'NaN in output');
    const drop = before - floorDb(y);
    console.log(`denoise ${strength.padEnd(6)} background noise -${drop.toFixed(1)} dB`);
    assert.ok(drop > 8, `${strength} should remove at least 8 dB of noise`);
  }
  const polished = await E.denoise(mixed, sr);
  assert.ok(E.peak(polished) <= 0.95, 'output must not clip');

  for (const fx of E.EFFECTS) {
    const y = await E.applyEffect(voice, sr, fx.id, { pitch: fx.id === 'none' ? 3 : 0 });
    assert.ok(y.length >= voice.length && y.every(Number.isFinite) && E.peak(y) <= 0.98, 'effect ' + fx.id);
  }
  console.log(`effects  all ${E.EFFECTS.length} OK`);

  const wav = E.encodeWAV(mixed, sr), back = E.decodeWAV(wav);
  assert.strictEqual(back.sampleRate, sr); assert.strictEqual(back.samples.length, mixed.length);
  const mp3 = await E.encodeMP3(mixed, sr, 192, lame);
  assert.ok(mp3.length > 1000 && mp3[0] === 0xff, 'mp3 frame header');
  const odd = await E.encodeMP3(mixed, 37000, 128, lame);
  assert.ok(odd.length > 1000, 'mp3 at unusual sample rate');
  console.log(`export   WAV ${(wav.length / 1024).toFixed(0)} KB, MP3 ${(mp3.length / 1024).toFixed(0)} KB OK`);
  console.log('All engine tests passed.');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
