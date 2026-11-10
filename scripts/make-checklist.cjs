// Builds the Play Store launch checklist (.docx)
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, LevelFormat, AlignmentType, BorderStyle } = require('docx');

const OUT = process.argv[2] || '2026-11-09-clear-audio-recorder-launch-checklist.docx';
const FONT = 'Arial';
const ACCENT = '0E9F6E', MUTED = '5A626D';

const short = 'Record and remove background noise in one tap. Voice effects, folders, MP3/WAV.';
if (short.length > 80) throw new Error('short description too long: ' + short.length);

let inst = 0;
const runs = text => {
  // **bold** support
  return String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(t => t.startsWith('**') ? new TextRun({ text: t.slice(2, -2), bold: true }) : new TextRun(t));
};
const p = (text, opts = {}) => new Paragraph({ children: runs(text), spacing: { after: 120 }, ...opts });
const note = text => new Paragraph({ children: [new TextRun({ text, italics: true, color: MUTED })], spacing: { before: 80, after: 140 } });
const h1 = text => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = text => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
function steps(items) { inst++; return items.map(t => new Paragraph({ children: runs(t), numbering: { reference: 'steps', level: 0, instance: inst }, spacing: { after: 80 } })); }
const checks = items => items.map(t => new Paragraph({ children: runs(t), numbering: { reference: 'checks', level: 0 }, spacing: { after: 80 } }));
const bullets = items => items.map(t => new Paragraph({ children: runs(t), numbering: { reference: 'bullets', level: 0 }, spacing: { after: 80 } }));

const border = { style: BorderStyle.SINGLE, size: 4, color: 'D5DAE0' };
function table(widths, rows) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((r, ri) => new TableRow({
      tableHeader: ri === 0, cantSplit: true,
      children: r.map((c, ci) => new TableCell({
        width: { size: widths[ci], type: WidthType.DXA },
        borders: { top: border, bottom: border, left: border, right: border },
        shading: ri === 0 ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E8F7F0' } : undefined,
        margins: { top: 80, bottom: 80, left: 110, right: 110 },
        children: [new Paragraph({ children: ri === 0 ? [new TextRun({ text: c, bold: true })] : runs(c) })],
      })),
    })),
  });
}
const gap = () => new Paragraph({ children: [], spacing: { after: 60 } });

const children = [
  new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('Clear Audio Recorder: Play Store launch checklist')] }),
  new Paragraph({ children: [new TextRun({ text: 'Version 1.0 · 9 Nov 2026 · Package name com.daxator.clearaudiorecorder', color: MUTED })], spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 8 } } }),

  p('**Done:** the full Android app (recording, one-tap noise removal, 12 voice effects, folders, MP3/WAV export, ads, $2/month Pro), the auto-build on GitHub, app icon, splash and Play Store graphics.'),
  p('**Left for you:** put the code on GitHub, test it on your phone, create the accounts, paste 3 keys, fill the Play Console forms, run the 14-day closed test.'),

  h1('1. Test it on your phone (today, about 20 minutes)'),
  ...steps([
    'On GitHub, create a new **private** repository named **clear-audio-recorder** (leave it empty, no README).',
    'Unzip the project zip. On the repo page click **Add file → Upload files**, drag in everything from the unzipped folder (99 files, just under GitHub\'s 100-file limit), and commit to **main**. Or send Claude the repo name and it can push the code for you.',
    'Open the **Actions** tab. "Build Android app" starts by itself and takes about 10 minutes.',
    'When it turns green, open the run, scroll to **Artifacts**, download **clear-audio-recorder-test-apk**, unzip it and send the .apk to your phone. Tap it and allow "Install unknown apps".',
  ]),
  p('Then check these on the phone:'),
  ...checks([
    'Record with the mic (allow mic access), pause, resume, save.',
    'Clean audio: compare Before / After. Try Light, Medium, Strong.',
    'Voice effects and the pitch slider. Locked effects open the Pro screen.',
    'Create folders, move recordings, rename, search, delete.',
    'Export MP3 and WAV: the share menu opens, save to Files or send on WhatsApp.',
    'Ads show as "Test Ad" (banner at the bottom, full-screen after an export).',
    'Uninstall, reinstall: your recordings must be gone.',
  ]),

  h1('2. Accounts you need (one time)'),
  table([2300, 2000, 5000], [
    ['Account', 'Cost', 'What it\'s for'],
    ['Google Play Console', '$25 one-time', 'Publishing. Pakistan is a supported merchant country, so subscription money can be paid out to you. Identity check takes a few days.'],
    ['AdMob', 'Free', 'Ad revenue from free users. Paid by bank wire after you pass the payout threshold.'],
    ['RevenueCat', 'Free up to $2,500/month revenue, then 1%', 'Runs the $2 subscription: checks payments, restores Pro on a new phone.'],
    ['GitHub', 'Free', 'Builds the app automatically every time the code changes.'],
  ]),
  note('Google keeps 15% of subscription payments, so each Pro user brings in about $1.70 a month before tax.'),

  h1('3. Decide the package name now'),
  p('**com.daxator.clearaudiorecorder** becomes permanent after the first upload to Play. If you want it under another brand (for example com.unaxgames.clearaudio), ask Claude to change it before step 4.'),

  h1('4. Signing key (5 minutes)'),
  ...steps([
    'In **Actions**, run **"Make Play Store upload key (run once)"**.',
    'Download the artifact within 24 hours. Open **SECRETS-TO-ADD.txt** and add the 4 secrets it lists under **Settings → Secrets and variables → Actions**.',
    'Save **upload-key.jks** and the passwords in two safe places (Google Drive and a USB stick), then delete the artifact from the run.',
    'From now on every build also produces **clear-audio-recorder-play-store-aab**, the file you upload to Play. Keep Play App Signing switched on (the default).',
  ]),

  h1('5. The $2/month subscription'),
  ...steps([
    'In Play Console create the app, then upload the first .aab to **Testing → Internal testing**. Play only lets you create subscriptions after one upload.',
    '**Monetize → Products → Subscriptions → Create**: product ID **clear_pro_monthly**, one auto-renewing monthly base plan, price **US$1.99** (or $2.00). Let Google fill local prices.',
    'In RevenueCat: new project → add an Android app with the package name → connect the Play service account credentials (follow RevenueCat\'s Google Play setup guide) → import the product.',
    'Create an entitlement named exactly **pro** and attach the product. Create an offering **default** with a **Monthly** package.',
    'Copy the Android public SDK key (starts with **goog_**) into **src/native/config.js → revenueCatAndroidKey**. Commit; GitHub builds a new version.',
    'Add your Gmail under **Play Console → Settings → License testing** so your own test purchases are free.',
  ]),

  h1('6. Ads'),
  ...steps([
    'AdMob → **Apps → Add app** (Android, "not published yet" is fine). Copy the **App ID** into **android/app/src/main/AndroidManifest.xml**, replacing the test ID.',
    'Create two ad units, **Banner** (anchored adaptive) and **Interstitial**. Paste both IDs into **src/native/config.js** and set **adsTestMode: false**.',
    '**Privacy & messaging → European regulations**: create and publish the consent message. The app already shows it to EU/UK users.',
    'AdMob gives you an **app-ads.txt** line. Put it at **yourwebsite.com/app-ads.txt** and use that website in the Play listing.',
    'Never tap your own live ads. Keep test mode on while you test.',
  ]),

  h1('7. Store listing (ready to paste)'),
  table([2300, 7000], [
    ['Field', 'Text'],
    ['App name', 'Clear Audio Recorder'],
    ['Short description', short],
    ['Category', 'Music & Audio'],
    ['Graphics', 'store/play-icon-512.png and store/play-feature-graphic-1024x500.png (in the project). Add 4 to 8 phone screenshots: Record screen, Before/After, Voice effects, Library.'],
  ]),
  h2('Full description'),
  p('Turn noisy phone recordings into clean, clear audio in one tap.'),
  p('Record voice notes, lectures, interviews, podcasts or song ideas, or import any audio or video file. Tap Clean and Clear Audio Recorder removes fan noise, AC hum, hiss and room echo, then levels your voice so it sounds close and even. Flip between Before and After to hear the difference.'),
  ...bullets([
    'One-tap noise removal with Light, Medium and Strong modes',
    '12 voice effects: Deep, Chipmunk, Echo, Robot, Radio, Phone call, Cave, Monster, Alien, Stadium, Wobble, plus a pitch slider',
    'Folders, rename, search and sort to keep every recording easy to find',
    'Export to MP3 (128, 192 or 320 kbps) or lossless WAV and share anywhere',
    'Private by design: recordings stay on your phone and never upload anywhere',
  ]),
  p('Free to use with ads, including 30 seconds of free cleaning. Clear Pro ($2/month) gives unlimited cleaning, every effect and no ads. Cancel anytime in Google Play.'),

  h1('8. Play Console forms (App content)'),
  table([2600, 6700], [
    ['Form', 'Answer'],
    ['Privacy policy', 'Link to the policy in the appendix, hosted on your website or a free Google Sites page.'],
    ['Ads', 'Yes, the app contains ads.'],
    ['App access', 'All features work without a login.'],
    ['Advertising ID', 'Yes, used for advertising (AdMob).'],
    ['Target audience', '18 and over. This keeps the app outside Google\'s strict rules for kids\' apps with ads.'],
    ['Content rating', 'Fill the questionnaire as a utility app: no violence, no user-to-user sharing, no gambling.'],
  ]),
  h2('Data safety'),
  table([2800, 2400, 4100], [
    ['Data', 'Collected?', 'Details'],
    ['Audio recordings', 'No', 'Processed and stored only on the phone.'],
    ['Device or other IDs', 'Yes, shared', 'AdMob, for advertising and fraud prevention.'],
    ['Approximate location', 'Yes, shared', 'AdMob estimates it from the IP address for ads.'],
    ['App info and performance', 'Yes, shared', 'AdMob diagnostics (crash and ad performance).'],
    ['Purchase history', 'Yes', 'Google Play and RevenueCat, to know who has Pro.'],
  ]),
  note('Data is encrypted in transit. Check AdMob\'s own data-disclosure page when you fill the form, in case Google has updated it.'),

  h1('9. Closed test, then go live'),
  ...steps([
    'New personal developer accounts must run a **closed test with at least 12 testers who stay opted in for 14 days in a row** before applying for production.',
    'Invite friends, family, your team or students. Each tester joins with the opt-in link and installs from Play. Ask them to record, clean and export at least once.',
    'Fix anything they report, then apply for production access from the Play Console dashboard. Review usually takes a few days.',
  ]),

  h1('10. Known limits and next upgrades'),
  ...bullets([
    '**Noise removal** uses a spectral engine. It removes steady noise well (fan, AC, hiss, hum, traffic rumble, room tone) but can\'t fully separate your voice from other people talking or loud music. Next upgrade: an on-device AI voice model as a "Studio AI" Pro mode.',
    '**The 30 free seconds** are stored on the phone, so reinstalling resets them. Later fix: tie the allowance to the Google account through RevenueCat.',
    '**Not yet tested on a real phone.** Step 1 is that test. Send anything that looks off and it gets fixed in the next build.',
    '**iPhone version** later from the same code. Needs an Apple developer account ($99/year) and a Mac or a cloud build service.',
  ]),

  h1('Appendix: privacy policy (host this text)'),
  p('**Clear Audio Recorder Privacy Policy** (last updated 9 November 2026)'),
  p('Your recordings stay on your device. Clear Audio Recorder records and processes audio entirely on your phone. We do not upload, store or have access to your recordings. Uninstalling the app permanently deletes them.'),
  p('Microphone: the app uses the microphone only while you are recording.'),
  p('Ads: the free version shows ads from Google AdMob. AdMob may collect your device\'s advertising ID, approximate location from your IP address and diagnostic data to show and measure ads. See Google\'s policy at policies.google.com/privacy. Users in the EU/UK are asked for consent first. You can reset your advertising ID in your phone\'s settings.'),
  p('Subscriptions: payments are handled by Google Play. We use RevenueCat to confirm whether you have an active subscription. We never see your card details.'),
  p('Children: the app is not directed at children under 13.'),
  p('Contact: [your email]'),
];

const doc = new Document({
  creator: 'Daxator', title: 'Clear Audio Recorder: Play Store launch checklist',
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 40, bold: true, color: '0B1220' }, paragraph: { spacing: { before: 0, after: 80 }, keepNext: true } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: ACCENT }, paragraph: { spacing: { before: 300, after: 120 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 23, bold: true, color: '0B1220' }, paragraph: { spacing: { before: 200, after: 100 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 300 } } } }] },
    { reference: 'checks', levels: [{ level: 0, format: LevelFormat.BULLET, text: '☐', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 300 } } } }] },
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 300 } } } }] },
  ] },
  sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1300, right: 1300 } } }, children }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('wrote', OUT, b.length, 'bytes'); });
