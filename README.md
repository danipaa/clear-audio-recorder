# Clear Audio Recorder

Record or import audio, remove background noise in one tap, add voice effects, organize in folders, export MP3/WAV.
Android app built with Capacitor 8 (targets Android 16 / API 36). Free with ads, Pro is $2/month.

## Get the app on your phone (no coding)

1. Create an empty **private** repo on GitHub (e.g. `clear-audio-recorder`) and upload this whole folder to it.
2. Open the repo's **Actions** tab. The "Build Android app" job starts by itself (about 8–12 minutes).
3. When it's green, open the run, scroll to **Artifacts**, download `clear-audio-recorder-test-apk`.
4. Unzip, send the `.apk` to your phone, tap it, allow "install unknown apps". Done.

Every time code changes on `main`, a fresh APK is built automatically.

## Before publishing on Google Play

Edit one file: `src/native/config.js`

| Setting | What to put |
|---|---|
| `firebase`, `googleWebClientId` | From your Firebase project (see guide 1) |
| `revenueCatAndroidKey` | Your RevenueCat Android key (starts with `goog_`) |
| `admob.banner` / `admob.interstitial` | Your AdMob ad unit IDs |
| `adsTestMode` | `false` |

And one line in `android/app/src/main/AndroidManifest.xml`: replace the AdMob **App ID** (`ca-app-pub-3940256099942544~3347511713`) with yours.

Then run the **"Make Play Store upload key (run once)"** workflow in Actions, add the 4 secrets it tells you to, and every build will also produce a signed `.aab` for the Play Store.

The full step-by-step launch checklist is in the separate Word doc.

## New in this version

- KYRO look: lime and ink palette, pixel-dither glow, sparkles.
- Record with a volume button (start, pause, resume).
- Optional Google sign-in. Pro plan, free seconds, folders and settings restore on a new phone. Audio stays on the phone.
- Send to PC: download recordings from the phone in any browser on the same Wi-Fi.
- Admin dashboard (`admin/` folder) with stats, user management and remote app settings.
- Database security rules in `firebase/firestore.rules`.
- Three PDF guides in `guides/`. Start with guide 2 (launch), then guide 1 (owner and admin).

## What's where

| Path | What it is |
|---|---|
| `src/engine.js` | Audio engine: noise removal, 12 voice effects, pitch, WAV/MP3 encoding. Runs fully on the phone. |
| `src/app.js`, `src/body.html`, `src/styles.css` | The app's screens, animations and logic |
| `src/native/native.js` | Android side: private storage, share sheet, AdMob, Google Play billing |
| `src/native/cloud.js` | Google sign-in and account sync (Firebase) |
| `android/app/src/main/java/...` | Volume keys, keep-awake, Send to PC web server |
| `admin/` | Admin dashboard: upload this folder to a free static host |
| `firebase/firestore.rules` | Database security rules: paste into Firebase console |
| `guides/` | Owner, launch and money guides (PDF) |
| `src/native/config.js` | Your keys and ad IDs (the only file you edit) |
| `android/` | The Android Studio project |
| `scripts/build.mjs` | Builds `www/` for the app and `dist/preview.html` for the browser preview |
| `tests/engine.test.cjs` | Checks noise removal, effects and export (runs on every build) |
| `store/` | Play Store icon (512×512) and feature graphic (1024×500) |

## For a developer

```bash
npm install
npm test               # audio engine checks
npm run sync           # build web layer + copy into android/
npx cap open android   # open in Android Studio
npm run build:preview  # single-file browser preview in dist/
```

**Storage:** recordings are saved in the app's private data folder (`Directory.Data`). Android deletes it on uninstall, and
`allowBackup="false"` + `data_extraction_rules.xml` stop backups and phone-to-phone transfer, so recordings never come back after uninstall.
The free 30-second cleaning allowance is stored there too.
