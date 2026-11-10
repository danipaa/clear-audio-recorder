// ============================================================
//  CLEAR AUDIO RECORDER — the only file you need to edit
//  before publishing. Everything else works as-is.
//  None of these values are secret: they are public IDs.
//  Never paste a "service account" key or any private key here.
// ============================================================
export const CONFIG = {
  appVersion: '1.0',

  // 1) Firebase (free "Spark" plan): Google sign-in, user base, admin panel, remote settings.
  //    Firebase console → Project settings → Your apps → Web app → "firebaseConfig".
  //    Leave empty and the app still works, just without accounts.
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
  },
  // Firebase console → Authentication → Sign-in method → Google → "Web client ID".
  // Ends with ".apps.googleusercontent.com".
  googleWebClientId: '',

  // 2) RevenueCat (handles the $2/month Google Play subscription).
  //    app.revenuecat.com → Project → API keys → Android public key. Starts with "goog_".
  revenueCatAndroidKey: '',
  entitlementId: 'pro',

  // 3) AdMob. These are Google's official TEST ad IDs, safe for testing.
  //    Replace with your own ad unit IDs before release and set adsTestMode to false.
  //    (Your AdMob *App ID* goes in android/app/src/main/AndroidManifest.xml.)
  admob: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
  adsTestMode: true,

  // Minimum minutes between full-screen ads for free users (the admin panel can override this).
  interstitialEveryMinutes: 3,
};
