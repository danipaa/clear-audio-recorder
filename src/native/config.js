// ============================================================
//  CLEAR AUDIO RECORDER — the only file you need to edit
//  before publishing. Everything else works as-is.
// ============================================================
export const CONFIG = {
  // 1) RevenueCat (handles the $2/month Google Play subscription).
  //    Free until you earn $2,500/month. Paste your Android public SDK key
  //    from app.revenuecat.com → Project → API keys. It starts with "goog_".
  //    Leave empty to build without subscriptions (Pro button will say "not set up").
  revenueCatAndroidKey: '',

  // The entitlement name you create in RevenueCat. Keep it "pro".
  entitlementId: 'pro',

  // 2) AdMob. These are Google's official TEST ad IDs, safe for testing.
  //    Replace with your own ad unit IDs from admob.google.com before release,
  //    and set adsTestMode to false.
  //    (Your AdMob *App ID* goes in android/app/src/main/AndroidManifest.xml.)
  admob: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
  adsTestMode: true,

  // Minimum minutes between full-screen ads for free users.
  interstitialEveryMinutes: 3,
};
