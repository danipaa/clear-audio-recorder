// Native layer for the Android app: private storage, sharing, ads, billing.
// Bundled into www/native.js by scripts/build.mjs. On the web it does nothing,
// so the same app.js runs in the browser preview too.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { registerPlugin } from '@capacitor/core';
import { CONFIG } from './config.js';
import { createCloud } from './cloud.js';

const ClearNative = registerPlugin('ClearNative');

// Directory.Data is the app's private folder. Android deletes it when the app is uninstalled.
const DIR = Directory.Data;
const AUDIO = 'recordings';
const CHUNK = 1536 * 1024; // multiple of 3, so every base64 chunk is self-contained

function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
async function writeBinary(path, bytes, directory) {
  for (let i = 0; i < bytes.length || i === 0; i += CHUNK) {
    const data = toB64(bytes.subarray(i, i + CHUNK));
    if (i === 0) await Filesystem.writeFile({ path, data, directory, recursive: true });
    else await Filesystem.appendFile({ path, data, directory });
    if (!bytes.length) break;
  }
}
// Read big files through the WebView's local file server instead of the base64 bridge
async function readBinary(path, directory) {
  const { uri } = await Filesystem.getUri({ path, directory });
  const res = await fetch(Capacitor.convertFileSrc(uri));
  if (!res.ok) throw new Error('read failed ' + res.status);
  return new Uint8Array(await res.arrayBuffer());
}

if (Capacitor.isNativePlatform()) {
  const hasBilling = !!CONFIG.revenueCatAndroidKey;
  let pkg = null, bannerOn = false, adsReady = false, lastInterstitial = 0;
  const setAdHeight = h => document.documentElement.style.setProperty('--ad-h', `${Math.max(0, Math.round(h || 0))}px`);

  async function loadPackage() {
    try {
      const offerings = await Purchases.getOfferings();
      pkg = (offerings.current && offerings.current.monthly) || (offerings.current && offerings.current.availablePackages[0]) || null;
      if (pkg) window.NativePlatform.billing.price = pkg.product.priceString;
    } catch (e) { console.warn('offerings', e); }
  }
  const isActive = info => !!(info && info.entitlements && info.entitlements.active && info.entitlements.active[CONFIG.entitlementId]);

  let interstitialMinutes = CONFIG.interstitialEveryMinutes;
  window.NativePlatform = {
    name: 'android',
    version: CONFIG.appVersion,
    cloud: createCloud(CONFIG, 'android'),
    async init() {
      try { await Filesystem.mkdir({ path: AUDIO, directory: DIR, recursive: true }); } catch (e) { /* exists */ }
      try { await StatusBar.setStyle({ style: Style.Dark }); await StatusBar.setBackgroundColor({ color: '#08090a' }); } catch (e) { }
      App.addListener('backButton', () => { if (!(window.ClearApp && window.ClearApp.onBack())) App.exitApp(); });
    },
    async loadMeta() {
      try { const r = await Filesystem.readFile({ path: 'library.json', directory: DIR, encoding: Encoding.UTF8 }); return JSON.parse(r.data); }
      catch (e) {
        try { const r = await Filesystem.readFile({ path: 'library.backup.json', directory: DIR, encoding: Encoding.UTF8 }); return JSON.parse(r.data); }
        catch (e2) { return null; }
      }
    },
    async saveMeta(meta) {
      const data = JSON.stringify(meta);
      await Filesystem.writeFile({ path: 'library.json', data, directory: DIR, encoding: Encoding.UTF8 });
      Filesystem.writeFile({ path: 'library.backup.json', data, directory: DIR, encoding: Encoding.UTF8 }).catch(() => { });
    },
    putAudio: (key, bytes) => writeBinary(`${AUDIO}/${key}.wav`, bytes, DIR),
    async getAudio(key) { try { return await readBinary(`${AUDIO}/${key}.wav`, DIR); } catch (e) { return null; } },
    async deleteAudio(key) { try { await Filesystem.deleteFile({ path: `${AUDIO}/${key}.wav`, directory: DIR }); } catch (e) { } },
    async exportFile(filename, bytes) {
      const path = `exports/${filename}`;
      try {
        await writeBinary(path, bytes, Directory.Cache);
        const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
        await Share.share({ title: filename, files: [uri], dialogTitle: 'Save or send your audio' });
        return { ok: true };
      } catch (e) {
        const msg = String((e && e.message) || e);
        if (/cancel/i.test(msg)) return { ok: false, quiet: true };
        return { ok: false, message: 'Couldn\'t open the share menu. Try again.' };
      }
    },
    device: {
      async setVolumeCapture(enabled) { try { await ClearNative.setVolumeCapture({ enabled: !!enabled }); } catch (e) { } },
      async keepAwake(on) { try { await ClearNative.keepAwake({ on: !!on }); } catch (e) { } },
    },
    // "Send to PC": files are written to the app's cache, then served on the local Wi-Fi only.
    transfer: {
      async start(files) {
        try {
          try { await Filesystem.rmdir({ path: 'send', directory: Directory.Cache, recursive: true }); } catch (e) { }
          const list = [];
          for (let i = 0; i < files.length; i++) {
            const path = `send/${i}-${files[i].name.replace(/[^\w.() -]+/g, '_')}`;
            await writeBinary(path, files[i].bytes, Directory.Cache);
            const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
            list.push({ path: uri, name: files[i].name });
          }
          const r = await ClearNative.startShare({ files: list });
          return { ok: true, url: r.url, count: r.count };
        } catch (e) {
          const msg = String((e && e.message) || e);
          if (/NO_WIFI/.test(msg)) return { ok: false, message: 'Connect this phone to Wi-Fi (the same one as your computer) and try again.' };
          return { ok: false, message: 'Couldn\'t start sending. Try again.' };
        }
      },
      async status() { try { return await ClearNative.shareStatus(); } catch (e) { return { running: false, downloads: 0 }; } },
      async stop() {
        try { await ClearNative.stopShare(); } catch (e) { }
        try { await Filesystem.rmdir({ path: 'send', directory: Directory.Cache, recursive: true }); } catch (e) { }
      },
    },
    billing: {
      price: '$2.00',
      // Ties the subscription to the signed-in account so Pro follows the user to a new phone.
      async identify(uid) {
        if (!hasBilling) return false;
        try {
          const { customerInfo } = uid ? await Purchases.logIn({ appUserID: uid }) : await Purchases.logOut();
          return isActive(customerInfo);
        } catch (e) { return false; }
      },
      async init() {
        if (!hasBilling) return;
        try { await Purchases.setLogLevel({ level: LOG_LEVEL.WARN }); } catch (e) { }
        await Purchases.configure({ apiKey: CONFIG.revenueCatAndroidKey });
        await loadPackage();
      },
      async isPro() {
        if (!hasBilling) return false;
        try { const { customerInfo } = await Purchases.getCustomerInfo(); return isActive(customerInfo); } catch (e) { return false; }
      },
      async purchase() {
        if (!hasBilling) return { ok: false, message: 'Subscriptions aren\'t set up yet. Add your RevenueCat key in config.js.' };
        if (!pkg) await loadPackage();
        if (!pkg) return { ok: false, message: 'Pro isn\'t available right now. Check your connection and try again.' };
        try { const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg }); return { ok: isActive(customerInfo) }; }
        catch (e) { if (e && (e.userCancelled || e.code === '1' || e.code === 1)) return { ok: false, quiet: true }; return { ok: false, message: (e && e.message) || 'Purchase failed' }; }
      },
      async restore() {
        if (!hasBilling) return { ok: false, pro: false };
        try { const { customerInfo } = await Purchases.restorePurchases(); return { ok: true, pro: isActive(customerInfo) }; } catch (e) { return { ok: false, pro: false }; }
      },
    },
    ads: {
      async init() {
        await AdMob.initialize({ initializeForTesting: CONFIG.adsTestMode });
        // Google's consent message (required for users in the EU/UK)
        try {
          const info = await AdMob.requestConsentInfo();
          if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) await AdMob.showConsentForm();
        } catch (e) { console.warn('consent', e); }
        AdMob.addListener(BannerAdPluginEvents.SizeChanged, size => { if (bannerOn) setAdHeight(size.height); });
        adsReady = true;
      },
      async showBanner() {
        if (!adsReady || bannerOn) return;
        bannerOn = true;
        try {
          await AdMob.showBanner({ adId: CONFIG.admob.banner, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 0, isTesting: CONFIG.adsTestMode });
        } catch (e) { bannerOn = false; setAdHeight(0); }
      },
      async hideBanner() {
        if (!bannerOn) return;
        bannerOn = false; setAdHeight(0);
        try { await AdMob.removeBanner(); } catch (e) { }
      },
      setInterstitialMinutes(m) { if (m >= 1 && m <= 120) interstitialMinutes = m; },
      async interstitial() {
        if (!adsReady || Date.now() - lastInterstitial < interstitialMinutes * 60000) return;
        lastInterstitial = Date.now();
        try { await AdMob.prepareInterstitial({ adId: CONFIG.admob.interstitial, isTesting: CONFIG.adsTestMode }); await AdMob.showInterstitial(); } catch (e) { }
      },
    },
  };
}
