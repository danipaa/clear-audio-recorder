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
| `revenueCatAndroidKey` | Your RevenueCat Android key (starts with `goog_`) |
| `admob.banner` / `admob.interstitial` | Your AdMob ad unit IDs |
| `adsTestMode` | `false` |

And one line in `android/app/src/main/AndroidManifest.xml`: replace the AdMob **App ID** (`ca-app-pub-3940256099942544~3347511713`) with yours.

Then run the **"Make Play Store upload key (run once)"** workflow in Actions, add the 4 secrets it tells you to, and every build will also produce a signed `.aab` for the Play Store.

The full step-by-step launch checklist is in the separate Word doc.

## What's where

| Path | What it is |
|---|---|
| `src/engine.js` | Audio engine: noise removal, 12 voice effects, pitch, WAV/MP3 encoding. Runs fully on the phone. |
| `src/app.js`, `src/body.html`, `src/styles.css` | The app's screens, animations and logic |
| `src/native/native.js` | Android side: private storage, share sheet, AdMob, Google Play billing |
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
