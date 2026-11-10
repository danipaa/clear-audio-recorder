#!/usr/bin/env python3
"""Builds the three KYRO-themed PDF guides into guides/. Usage: python3 scripts/make-guides.py <shots-dir>"""
import asyncio, base64, os, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[1]
OUT = os.path.join(ROOT, 'guides'); os.makedirs(OUT, exist_ok=True)
FONTS = os.path.join(ROOT, 'node_modules/@fontsource-variable')

def font(family, rel):
    b = base64.b64encode(open(os.path.join(FONTS, rel), 'rb').read()).decode()
    return f'@font-face{{font-family:"{family}";src:url(data:font/woff2;base64,{b}) format("woff2");font-weight:100 900}}'

def img(name, width=None):
    from PIL import Image
    import io
    im = Image.open(os.path.join(SHOTS, name)).convert('RGB')
    if width and im.width > width: im = im.resize((width, int(im.height * width / im.width)))
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=86)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

STAR = '<svg class="star" viewBox="0 0 24 24"><path d="M12 0c.9 6.4 4.9 10.6 12 12-7.1 1.4-11.1 5.6-12 12-.9-6.4-4.9-10.6-12-12C7.1 10.6 11.1 6.4 12 0z" fill="currentColor"/></svg>'

CSS = font('Unbounded', 'unbounded/files/unbounded-latin-wght-normal.woff2') + font('Geist', 'geist/files/geist-latin-wght-normal.woff2') + font('Geist Mono', 'geist-mono/files/geist-mono-latin-wght-normal.woff2') + '''
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #08090a; color: #eeeae2; font: 10.6pt/1.55 "Geist", sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
table.frame { width: 100%; border-collapse: collapse; }
table.frame > thead td, table.frame > tfoot td { height: 15mm; padding: 0; }
table.frame > tbody > tr > td { padding: 0 17mm; vertical-align: top; }
.cover { height: 297mm; padding: 26mm 17mm 20mm; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between;
  background: radial-gradient(60% 40% at 85% 8%, rgba(30,214,138,.30), transparent 70%), radial-gradient(55% 38% at 10% 96%, rgba(214,255,63,.24), transparent 70%), #08090a; }
.cover::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 120mm; opacity: .5;
  background-image: linear-gradient(rgba(238,234,226,.55) 0 0), linear-gradient(rgba(238,234,226,.55) 0 0); background-size: 1.1mm 1.1mm, 1.1mm 1.1mm; background-position: 0 0, 1.4mm 1.4mm; background-repeat: repeat;
  -webkit-mask-image: radial-gradient(70% 90% at 50% 120%, #000 10%, transparent 70%); mask-image: radial-gradient(70% 90% at 50% 120%, #000 10%, transparent 70%); }
.wm { font-family: "Unbounded"; font-weight: 600; letter-spacing: .26em; font-size: 13pt; color: #eeeae2; position: relative; display: inline-block; }
.wm .star { position: absolute; top: -3mm; right: -5mm; width: 3.4mm; height: 3.4mm; color: #d6ff3f; }
.cover .kicker { font-family: "Geist Mono"; font-size: 9.5pt; color: #8f969b; margin-bottom: 5mm; }
.cover h1 { font-family: "Unbounded"; font-weight: 500; font-size: 40pt; line-height: 1.04; letter-spacing: -.035em; margin: 0; max-width: 150mm; }
.cover h1 em { font-style: normal; color: #d6ff3f; }
.cover p.lead { font-size: 13pt; color: #c3c8cb; max-width: 135mm; margin: 7mm 0 0; }
.cover .meta { font-family: "Geist Mono"; font-size: 8.5pt; color: #8f969b; position: relative; z-index: 1; }
.pill { display: inline-block; background: #d6ff3f; color: #0b0d02; font-weight: 600; font-size: 9pt; padding: 1.2mm 4mm; border-radius: 99px; margin-bottom: 7mm; }
h2 { font-family: "Unbounded"; font-weight: 500; font-size: 19pt; letter-spacing: -.03em; line-height: 1.15; margin: 9mm 0 -32mm; padding-bottom: 35mm; break-inside: avoid; }
h2 .n { font-family: "Geist Mono"; font-size: 9pt; color: #d6ff3f; letter-spacing: 0; display: block; margin-bottom: 1.5mm; }
h2:first-child { margin-top: 0; }
h3 { font-family: "Unbounded"; font-weight: 500; font-size: 11pt; letter-spacing: -.02em; margin: 6mm 0 -18mm; padding-bottom: 20mm; break-inside: avoid; }
p { margin: 0 0 3mm; color: #c3c8cb; } b, strong { color: #eeeae2; font-weight: 600; }
a { color: #d6ff3f; text-decoration: none; }
code, .mono { font-family: "Geist Mono"; font-size: 9pt; color: #d6ff3f; background: rgba(214,255,63,.08); padding: .2mm 1.4mm; border-radius: 1.2mm; }
ol, ul { margin: 0 0 3mm; padding-left: 5.5mm; color: #c3c8cb; } li { margin-bottom: 1.6mm; } li::marker { color: #d6ff3f; font-family: "Geist Mono"; font-size: 9pt; }
.card { background: #111315; border: .3mm solid rgba(255,255,255,.08); border-radius: 5mm; padding: 5mm 5.5mm; margin: 0 0 4mm; break-inside: avoid; }
.card.lime { border-color: rgba(214,255,63,.35); background: linear-gradient(180deg, rgba(214,255,63,.07), transparent 70%), #111315; }
.card.warn { border-color: rgba(255,210,54,.3); } .card.warn h3 { color: #ffd236; }
.card h3 { margin: 0 0 2mm; padding-bottom: 0; } .card > :last-child { margin-bottom: 0; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; } .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
.grid2 .card, .grid3 .card { margin: 0; } .grid2, .grid3 { margin-bottom: 4mm; break-inside: avoid; }
table.t { width: 100%; border-collapse: collapse; margin: 0 0 4mm; font-size: 9.6pt; break-inside: avoid; }
table.t th { text-align: left; font-family: "Geist Mono"; font-weight: 400; font-size: 8.4pt; color: #8f969b; padding: 2mm 2.5mm; border-bottom: .3mm solid rgba(255,255,255,.12); }
table.t td { padding: 2.4mm 2.5mm; border-bottom: .3mm solid rgba(255,255,255,.07); vertical-align: top; color: #c3c8cb; }
table.t td:first-child { color: #eeeae2; font-weight: 500; } table.t td.num { font-family: "Geist Mono"; white-space: nowrap; color: #d6ff3f; }
.shots { display: flex; gap: 4mm; margin: 2mm 0 5mm; break-inside: avoid; } .shots figure { margin: 0; flex: 1; min-width: 0; }
.shots img, .wide img { width: 100%; display: block; border-radius: 4mm; border: .3mm solid rgba(255,255,255,.1); }
figcaption { font-family: "Geist Mono"; font-size: 8pt; color: #8f969b; margin-top: 1.6mm; }
.wide { margin: 2mm 0 5mm; break-inside: avoid; }
.step { display: grid; grid-template-columns: 9mm 1fr; gap: 3mm; margin-bottom: 3.2mm; break-inside: avoid; }
.step .k { width: 8mm; height: 8mm; border-radius: 50%; background: #d6ff3f; color: #0b0d02; font-family: "Geist Mono"; font-weight: 600; font-size: 9pt; display: grid; place-items: center; box-shadow: 0 0 5mm -1mm rgba(214,255,63,.7); }
.step p { margin: 0 0 1mm; } .step .where { font-family: "Geist Mono"; font-size: 8.4pt; color: #8f969b; }
.flow { display: flex; align-items: stretch; gap: 2mm; margin: 2mm 0 5mm; break-inside: avoid; }
.flow div { flex: 1; background: #111315; border: .3mm solid rgba(255,255,255,.08); border-radius: 4mm; padding: 3.5mm; font-size: 9pt; color: #c3c8cb; }
.flow div b { display: block; font-size: 9.6pt; margin-bottom: 1mm; } .flow span { align-self: center; color: #d6ff3f; font-family: "Geist Mono"; }
.big { font-family: "Unbounded"; font-size: 20pt; letter-spacing: -.04em; color: #eeeae2; line-height: 1.1; } .big small { font-family: "Geist Mono"; font-size: 8.4pt; color: #8f969b; letter-spacing: 0; display: block; margin-top: 1mm; }
.check { list-style: none; padding-left: 0; } .check li { padding-left: 7mm; position: relative; } .check li::before { content: ""; position: absolute; left: 0; top: 1mm; width: 3.6mm; height: 3.6mm; border-radius: 1mm; border: .35mm solid #d6ff3f; }
.foot { font-family: "Geist Mono"; font-size: 8pt; color: #8f969b; margin-top: 8mm; border-top: .3mm solid rgba(255,255,255,.08); padding-top: 3mm; }
'''

def doc(title_html, kicker, lead, tag, body):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<section class="cover"><div><span class="wm">CLEAR{STAR}</span></div>
<div><span class="pill">{tag}</span><div class="kicker">{kicker}</div><h1>{title_html}</h1><p class="lead">{lead}</p></div>
<div class="meta">Clear Audio Recorder · version 1.0 · 10 November 2026 · prepared for Daxator</div></section>
<table class="frame"><thead><tr><td></td></tr></thead><tfoot><tr><td></td></tr></tfoot><tbody><tr><td>{body}</td></tr></tbody></table></body></html>'''

def step(n, html, where=''):
    return f'<div class="step"><div class="k">{n}</div><div><p>{html}</p>{f"<div class=where>{where}</div>" if where else ""}</div></div>'
def steps(items, start=1):
    return ''.join(step(start + i, *(it if isinstance(it, tuple) else (it,))) for i, it in enumerate(items))
def shots(*pairs, w=520):
    return '<div class="shots">' + ''.join(f'<figure><img src="{img(n, w)}"><figcaption>{c}</figcaption></figure>' for n, c in pairs) + '</div>'
def wide(name, cap, w=1500):
    return f'<figure class="wide"><img src="{img(name, w)}"><figcaption>{cap}</figcaption></figure>'
def h2(n, t, pb=False): return f'<h2{" style=\"break-before:page\"" if pb else ""}><span class="n">{n}</span>{t}</h2>'

# ------------------------------------------------------------------ 1. OWNER + ADMIN GUIDE
owner = doc('Run the app like an <em>owner</em>.', 'Guide 1 of 3 · Owner and admin', 'What you own, how the admin panel works, where it is hosted for free, and how your users\' data is protected.', 'Owner guide', f'''
{h2('01', 'What you own')}
<p>Clear Audio Recorder is four pieces. You never run a server of your own: the phone app talks straight to services that have free plans.</p>
<div class="flow"><div><b>The phone app</b>Records, cleans and stores audio on the phone only.</div><span>→</span><div><b>Firebase (free plan)</b>Google sign-in, the user list, app settings.</div><span>→</span><div><b>Your admin panel</b>A small website only you can open.</div></div>
<div class="flow"><div><b>Google Play</b>Sells the $2 subscription and pays you.</div><span>+</span><div><b>RevenueCat</b>Tells the app who is Pro, on any phone.</div><span>+</span><div><b>AdMob</b>Shows ads to free users and pays you.</div></div>
<div class="card lime"><h3>Why there is no server</h3><p>All audio work happens on the user's phone, so there is nothing heavy to host. Sign-in, the database and the rules that guard it are run by Google's Firebase. Its free Spark plan allows 50,000 database reads and 20,000 writes a day, 1 GiB of stored data and 50,000 monthly sign-in users. That covers roughly your first several thousand active users before you would pay anything.</p></div>

{h2('02', 'What users can do in version 1.0')}
{shots(('1-record.png', 'Record screen'), ('3-cleaned.png', 'One-tap clean, before and after'), ('n3-recording.png', 'Recording with the volume button'), ('n4-send.png', 'Send to PC over Wi-Fi'))}
<table class="t"><tr><th>Feature</th><th>How it works</th></tr>
<tr><td>Volume-button recording</td><td>You → Recording → choose Vol up, Vol down or Either. On the Record screen that button starts, pauses and resumes. The screen stays awake while recording. Phones do not let apps use the power button, so that option is not offered.</td></tr>
<tr><td>Send to PC</td><td>Library → Send to PC (or a recording's menu). The phone shows an address like <code>192.168.1.24:8080/482913</code>. Type it into any browser on a computer on the same Wi-Fi and click Download. Nothing goes through the internet. The link dies when the sheet is closed or after 15 minutes.</td></tr>
<tr><td>Restore on a new phone</td><td>Sign in with Google and the Pro plan, used free seconds, folder names and settings come back. Audio does not: it lives only on the phone it was recorded on, by design.</td></tr>
<tr><td>Delete account</td><td>You → Delete account removes the user's profile from your database. Google Play requires this option.</td></tr></table>

{h2('03', 'Set up Firebase (one time, about 25 minutes)')}
{steps([
 ('Go to <b>console.firebase.google.com</b> and create a project named <b>Clear Audio Recorder</b>. Stay on the free Spark plan.', 'Firebase console → Add project'),
 ('Turn on Google sign-in.', 'Build → Authentication → Get started → Sign-in method → Google → Enable → Save'),
 ('Create the database in <b>production mode</b>, any region near your users.', 'Build → Firestore Database → Create database'),
 ('Open the file <code>firebase/firestore.rules</code> from the project, copy everything, paste it over the rules shown, and press <b>Publish</b>. This is the lock on your user data.', 'Firestore Database → Rules'),
 ('Add a <b>Web app</b>. Copy the four values (apiKey, authDomain, projectId, appId) into <b>both</b> <code>src/native/config.js</code> and <code>admin/config.js</code>.', 'Project settings → Your apps → Add app → Web'),
 ('Copy the <b>Web client ID</b> into <code>googleWebClientId</code> in <code>src/native/config.js</code>.', 'Authentication → Sign-in method → Google → Web SDK configuration'),
 ('Add an <b>Android app</b> with package name <code>com.daxator.clearaudiorecorder</code> and paste the <b>SHA-1</b> fingerprint from your <code>SECRETS-TO-ADD.txt</code> file (Guide 2, step 4). After your first Play upload, add the second SHA-1 shown in Play Console → App integrity.', 'Project settings → Your apps → Add app → Android'),
])}
<div class="card warn"><h3>If Google sign-in fails on the phone</h3><p>Nine times out of ten the SHA-1 fingerprint is missing or belongs to a different key. Use the <b>signed</b> APK from GitHub (not the test APK) and check both fingerprints are in Firebase.</p></div>

{h2('04', 'Host the admin panel for free')}
<p>The admin panel is the <code>admin</code> folder: four small files, no server code. Any static host works. Two that allow commercial use on their free plans and accept a dragged folder:</p>
<div class="grid2"><div class="card"><h3>Cloudflare Pages</h3><p>dash.cloudflare.com → Workers &amp; Pages → Create → Pages → Upload assets. Drag the <code>admin</code> folder. You get an address like <code>clear-admin.pages.dev</code>.</p></div>
<div class="card"><h3>Netlify</h3><p>app.netlify.com → Add new site → Deploy manually. Drag the <code>admin</code> folder. You get an address like <code>clear-admin.netlify.app</code>.</p></div></div>
{steps([
 ('Fill in <code>admin/config.js</code> first (step 5 above), then upload the folder.',),
 ('Tell Firebase this website is allowed to sign in: add your new address.', 'Authentication → Settings → Authorized domains → Add domain'),
 ('Open your admin address and press <b>Continue with Google</b>. It will say "This account is not an admin" and show a long ID. Copy it.',),
 ('Make yourself the admin: create a collection named <code>admins</code>, with the Document ID set to that long ID, and one field <code>role</code> = <code>owner</code>. Reload the admin page.', 'Firestore Database → Data → Start collection'),
])}
<p>Only people listed in that <code>admins</code> collection can open the panel, and only the project owner can edit the collection, from inside the Firebase console. To update the panel later, upload the folder again.</p>

{h2('05', 'Using the admin panel', True)}
{wide('adm-d-1.png', 'Overview. The numbers in this picture are sample data; yours appear once Firebase is connected.')}
<table class="t"><tr><th>On the Overview</th><th>What it tells you</th></tr>
<tr><td>Estimated monthly revenue</td><td>Pro subscribers × $2, minus the store's 15%. It is an estimate from what phones report. The exact figure is in Play Console and RevenueCat.</td></tr>
<tr><td>Signed-in users, active in 7 days</td><td>How many people have accounts and how many came back this week. People who never sign in are not counted here; Play Console shows total installs.</td></tr>
<tr><td>New sign-ups, daily active users</td><td>30-day bar charts. Watch these after every marketing push.</td></tr>
<tr><td>What people do</td><td>Cleans, recordings and exports per day.</td></tr>
<tr><td>Free to Pro funnel</td><td>Signed in → cleaned once → used all free seconds → subscribed. The biggest drop shows where to work next.</td></tr>
<tr><td>Plans, app versions, most active users</td><td>Paying vs gifted vs free, who is on an old version, and your power users.</td></tr></table>
{wide('adm-d-2.png', 'Users. Search, filter, gift Pro, suspend, delete, export CSV.')}
<table class="t"><tr><th>Button</th><th>What it does</th><th>When to use it</th></tr>
<tr><td>Gift Pro</td><td>Gives that account every Pro feature without charging.</td><td>Reviewers, influencers, your testers, apologising for a bug.</td></tr>
<tr><td>Suspend</td><td>Signs the account out and blocks sign-in.</td><td>Abuse only. It does not stop a paid subscription; refund in Play Console.</td></tr>
<tr><td>Delete</td><td>Erases the profile from your database.</td><td>When someone emails asking for their data to be deleted.</td></tr>
<tr><td>Export CSV</td><td>Downloads the filtered list.</td><td>Monthly backup. Treat the file as private: it has emails.</td></tr></table>
{wide('adm-d-3.png', 'App settings. Changes reach every phone the next time the app is opened.')}
<table class="t"><tr><th>Setting</th><th>Effect</th></tr>
<tr><td>Free cleaning seconds</td><td>How much a free user can clean before the Pro screen. Start at 30. Raise it if few people reach the paywall, lower it if many reach it but few pay.</td></tr>
<tr><td>Show ads / minutes between full-screen ads</td><td>Pause ads instantly, or change how often the full-screen ad shows after an export.</td></tr>
<tr><td>Announcement</td><td>One line at the top of the Record screen: a sale, a new feature, a known problem.</td></tr>
<tr><td>Maintenance mode</td><td>Blocks the app for everyone with a "back in a few minutes" screen. Emergencies only.</td></tr></table>
<div class="card"><h3>Your routine</h3><p><b>Daily, 2 minutes:</b> open Overview, check sign-ups, active users and revenue. <b>Weekly:</b> read the funnel, reply to Play Store reviews, export the CSV. <b>Monthly:</b> compare the estimate with the real payout in Play Console and AdMob, and adjust free seconds or ad timing once, then wait two weeks before changing again.</p></div>

{h2('06', 'Security: what protects your users', True)}
<div class="grid2">
<div class="card"><h3>Audio never leaves the phone</h3><p>There is no audio on any server to leak. Phone backups are switched off for the app, so recordings do not end up in a cloud backup either.</p></div>
<div class="card"><h3>Database rules</h3><p>A user can read and change only their own profile. Nobody but an admin can list users. A user cannot make themselves Pro, admin, un-suspended, or lower their used free seconds.</p></div>
<div class="card"><h3>Admin list lives in Firebase</h3><p>The admin panel's web address is not a secret and does not need to be. Without being in the <code>admins</code> list, the database refuses every request.</p></div>
<div class="card"><h3>No secret keys in the app</h3><p>Everything inside the app and admin files is a public ID. Payments are verified by Google and RevenueCat, not by the app.</p></div>
<div class="card"><h3>Send to PC</h3><p>Works only on the local network, behind a random 6-digit code, serves only the files chosen, locks after 20 wrong codes and switches off after 15 minutes.</p></div>
<div class="card"><h3>Admin website</h3><p>Sent with headers that stop it being framed or indexed by search engines, and a content policy that only allows Google sign-in scripts.</p></div></div>
<div class="card warn"><h3>What nobody can promise</h3><p>No app is impossible to hack. What this design does is keep the valuable target small: the only personal data you hold is names, emails and usage counts, and it sits behind Google's sign-in and your rules. A determined person with a rooted phone can still unlock Pro features on their own phone; that costs you one $2 sale, not your user base. The database rules are written and reviewed, but they have not been run against a live Firebase project yet. Do the 3-minute check below before launch.</p></div>
<h3>Your eight security habits</h3>
<ul class="check">
<li>Turn on <b>2-step verification</b> on the Google account that owns Firebase, Play Console and AdMob. This matters more than anything else on this page.</li>
<li>Use a separate Google account for the business, not your everyday one.</li>
<li>Never paste a <b>service account</b> file or any "private key" into the app, the admin folder or a chat.</li>
<li>Keep the GitHub repository <b>private</b> and keep <code>upload-key.jks</code> out of it.</li>
<li>Do not change the Firestore rules to "test mode". If Firebase emails you that your rules are open, fix it that day.</li>
<li>Add a second admin only by adding their ID in the <code>admins</code> collection; remove it when they leave.</li>
<li>In Google Cloud console → Credentials, restrict the Android API key to your package name and SHA-1.</li>
<li>Later, turn on <b>Firebase App Check</b> (Play Integrity) so only your real app can talk to the database.</li></ul>
<div class="card lime"><h3>3-minute rules check before launch</h3><p>In Firebase → Firestore → Rules → <b>Rules Playground</b>: (1) simulate a <b>get</b> on <code>/users/abc</code> while signed in as a different user: it must be denied. (2) Simulate a <b>list</b> on <code>/users</code> as a normal user: denied. (3) Simulate an <b>update</b> on your own profile that sets <code>giftPro</code> to true: denied. If all three are denied, the lock works.</p></div>
<div class="foot">Sources: Firebase pricing (firebase.google.com/pricing), checked 10 November 2026.</div>
''')

# ------------------------------------------------------------------ 2. LAUNCH GUIDE
launch = doc('From Claude to the <em>Play Store</em>.', 'Guide 2 of 3 · Build and publish', 'Every step from the project zip to a live app, in order, with what to click and what to paste.', 'Launch guide', f'''
{h2('00', 'Where you are now')}
<div class="grid3"><div class="card lime"><div class="big">Built<small>app, admin panel, guides, store graphics</small></div></div><div class="card"><div class="big">Tested<small>in a browser and by automated checks, not yet on a real phone</small></div></div><div class="card"><div class="big">Yours to do<small>accounts, keys, store forms, 14-day test</small></div></div></div>
<p>This is how the app was made: you described it to Claude, Claude wrote the code and tested it, and packed everything into one project zip. GitHub turns that zip into an installable app, so you never open a code editor. The screenshots below are the real app.</p>
{shots(('0-splash.png', 'Splash'), ('1-record.png', 'Record'), ('4-fx.png', 'Voice effects and export'), ('5-paywall.png', 'Pro screen'), ('6-library.png', 'Library and folders'))}

{h2('01', 'Put the project on GitHub and get the app file')}
{steps([
 ('On <b>github.com</b> create a new <b>private</b> repository called <code>clear-audio-recorder</code>. Leave it empty.', 'github.com → New repository'),
 ('Send Claude the repository link and say "push the project". Claude uploads all the files. (Uploading by hand through the website is limited to 100 files at a time, and the project has slightly more.)',),
 ('Open the <b>Actions</b> tab. A job called <b>Build Android app</b> starts on its own and takes about 10 minutes.', 'Repository → Actions'),
 ('When it turns green, open it, scroll to <b>Artifacts</b> and download <b>clear-audio-recorder-test-apk</b>. Unzip it, send the .apk to your phone, tap it and allow "Install unknown apps".',),
])}
<div class="card warn"><h3>This first build is the real test</h3><p>The Android part could not be compiled inside Claude's workspace, so GitHub's build is the first full compile. If the job turns red, copy the red error text to Claude and it will be fixed. Expect one or two rounds of this.</p></div>

{h2('02', 'Test on your phone')}
<ul class="check"><li>Record, pause, resume, save. Try the volume-button option (You → Recording).</li><li>Clean a noisy recording. Compare Before and After on Light, Medium and Strong.</li><li>Try effects and the pitch slider. Locked effects should open the Pro screen.</li><li>Make folders, move, rename, search, delete.</li><li>Export MP3 and WAV through the share menu.</li><li>Send to PC: open the address on a laptop on the same Wi-Fi and download.</li><li>Ads show as "Test Ad".</li><li>Uninstall and reinstall: recordings must be gone.</li></ul>

{h2('03', 'Open your accounts')}
<table class="t"><tr><th>Account</th><th>Cost</th><th>Notes</th></tr>
<tr><td>Google Play Console</td><td class="num">$25 once</td><td>Identity check takes a few days. Pakistan is supported for selling and for wire payouts.</td></tr>
<tr><td>Firebase</td><td class="num">Free</td><td>Sign-in, user list, admin panel data. Set up in Guide 1, section 03.</td></tr>
<tr><td>RevenueCat</td><td class="num">Free to $2,500/mo</td><td>Then 1% of tracked revenue.</td></tr>
<tr><td>AdMob</td><td class="num">Free</td><td>Pays ad earnings.</td></tr>
<tr><td>Cloudflare or Netlify</td><td class="num">Free</td><td>Hosts the admin panel and your privacy policy page.</td></tr></table>

{h2('04', 'Create your signing key')}
{steps([
 ('In Actions, choose <b>Make Play Store upload key (run once)</b> → Run workflow.', 'Repository → Actions'),
 ('Download the artifact within 24 hours. Open <b>SECRETS-TO-ADD.txt</b> and add the four secrets it lists.', 'Repository → Settings → Secrets and variables → Actions → New repository secret'),
 ('The same text file contains your <b>SHA-1</b> fingerprint. Paste it into Firebase (Guide 1, step 7).',),
 ('Save <code>upload-key.jks</code> and the passwords in two safe places, then delete the artifact.',),
])}
<p>From now on every build also produces <b>clear-audio-recorder-signed-apk</b> (use this to test Google sign-in) and <b>clear-audio-recorder-play-store-aab</b> (the file you upload to Play).</p>

{h2('05', 'Paste your keys')}
<p>Everything goes in one file, <code>src/native/config.js</code>. You can edit it on github.com with the pencil icon; saving starts a new build.</p>
<table class="t"><tr><th>Line</th><th>Where the value comes from</th></tr>
<tr><td>firebase: apiKey, authDomain, projectId, appId</td><td>Firebase → Project settings → Your apps → Web app</td></tr>
<tr><td>googleWebClientId</td><td>Firebase → Authentication → Sign-in method → Google</td></tr>
<tr><td>revenueCatAndroidKey</td><td>RevenueCat → Project → API keys (starts with <code>goog_</code>)</td></tr>
<tr><td>admob.banner, admob.interstitial, adsTestMode: false</td><td>AdMob → Apps → Ad units</td></tr></table>
<p>One more: in <code>android/app/src/main/AndroidManifest.xml</code>, replace the test AdMob <b>App ID</b> with yours.</p>

{h2('06', 'The $2 subscription')}
{steps([
 ('Create the app in Play Console and upload your first .aab to Internal testing. Play only lets you create subscriptions after one upload.', 'Play Console → Testing → Internal testing'),
 ('Create a subscription with product ID <code>clear_pro_monthly</code>, one monthly auto-renewing base plan at <b>US$1.99</b> or $2.00.', 'Monetize → Products → Subscriptions'),
 ('In RevenueCat add an Android app with your package name, connect Play (follow their Google Play guide), and import the product.', 'app.revenuecat.com'),
 ('Create an entitlement named exactly <code>pro</code>, attach the product, and make an offering <b>default</b> with a <b>Monthly</b> package.',),
 ('Add your Gmail as a license tester so your own test purchases are free.', 'Play Console → Settings → License testing'),
])}

{h2('07', 'Ads')}
{steps([
 ('Add the app in AdMob and create two ad units: <b>Banner</b> and <b>Interstitial</b>.', 'admob.google.com → Apps'),
 ('Publish the European consent message. The app already shows it where required.', 'Privacy &amp; messaging → European regulations'),
 ('Put the <code>app-ads.txt</code> line AdMob gives you on the same website as your privacy policy.',),
 ('Never tap your own live ads. AdMob closes accounts for that.',),
])}

{h2('08', 'Store listing and forms')}
<p>Use the graphics in the project's <code>store</code> folder: the 512×512 icon and the 1024×500 feature graphic. Take 4 to 8 phone screenshots from the installed app. Upload <code>store/privacy-policy.html</code> to your free host and fill in the two bracketed lines.</p>
<table class="t"><tr><th>Field</th><th>Paste this</th></tr>
<tr><td>App name</td><td>Clear Audio Recorder</td></tr>
<tr><td>Short description</td><td>Record and remove background noise in one tap. Voice effects, folders, MP3/WAV.</td></tr>
<tr><td>Category</td><td>Music &amp; Audio</td></tr>
<tr><td>Ads</td><td>Yes, contains ads</td></tr>
<tr><td>App access</td><td>All features available without login (sign-in is optional)</td></tr>
<tr><td>Target audience</td><td>18 and over</td></tr>
<tr><td>Account deletion</td><td>In-app: You → Delete account. Web link: your privacy policy page, "Deleting your data" section.</td></tr></table>
<h3>Data safety form</h3>
<table class="t"><tr><th>Data</th><th>Collected</th><th>Why</th></tr>
<tr><td>Audio recordings</td><td>No</td><td>Stay on the device</td></tr>
<tr><td>Name, email address, user ID</td><td>Yes, optional</td><td>Account management (Google sign-in)</td></tr>
<tr><td>App interactions</td><td>Yes</td><td>Analytics (usage counts tied to the account)</td></tr>
<tr><td>Purchase history</td><td>Yes</td><td>To know who has Pro (Google Play, RevenueCat)</td></tr>
<tr><td>Device or other IDs, approximate location, diagnostics</td><td>Yes, shared</td><td>Advertising (AdMob)</td></tr></table>
<p>Answer "Yes" to data encrypted in transit and "Yes" to users can request deletion.</p>

{h2('09', 'Closed test, then go live')}
{steps([
 ('New personal developer accounts must run a <b>closed test with at least 12 testers opted in for 14 days in a row</b> before applying for production.', 'Play Console → Testing → Closed testing'),
 ('Invite friends, family, your team and students. Ask each to record, clean and export once. Gift them Pro from the admin panel so they test everything.',),
 ('Fix what they report (send it to Claude), then apply for production access. Review usually takes a few days.', 'Play Console → Dashboard'),
])}

{h2('10', 'iPhone and the App Store')}
<div class="card warn"><h3>Not included yet</h3><p>Version 1.0 is Android only. An iPhone version reuses the same screens and audio engine, but three parts must be rebuilt for iOS (volume-button control, Send to PC, subscriptions through Apple), and the app file can only be produced on a Mac or a paid cloud Mac service with an Apple Developer account ($99 a year). Launch on Android first, prove people pay, then ask Claude for the iOS pass.</p></div>
<div class="foot">Sources: Google Play testing requirements (support.google.com/googleplay/android-developer/answer/14151465), wire payouts (answer/2700656), Apple Developer Program (developer.apple.com/programs), RevenueCat pricing. Checked November 2026.</div>
''')

# ------------------------------------------------------------------ 3. MONEY + GROWTH
money = doc('How it <em>earns</em>, what it costs, how to grow it.', 'Guide 3 of 3 · Revenue, payments, costs, marketing', 'The two income streams, how the money reaches your bank in Pakistan, the real costs, and a 30-day launch plan.', 'Money and growth', f'''
{h2('01', 'Two income streams')}
<div class="grid2"><div class="card lime"><h3>Clear Pro · $2 a month</h3><p>Free users get 30 seconds of cleaning. After that the Pro screen appears. Pro removes the limit, unlocks all 12 effects and removes ads. Google Play charges the user every month until they cancel.</p></div>
<div class="card"><h3>Ads for free users</h3><p>A banner at the bottom, and one full-screen ad after an export, at most every 3 minutes. You can change both from the admin panel without an update.</p></div></div>
{shots(('5-paywall.png', 'The Pro screen'), ('5b-signin.png', 'Sign-in before buying, so Pro follows the account'), ('n2-account.png', 'Account and plan'), w=480)}

{h2('02', 'What you keep from each $2')}
<table class="t"><tr><th>Step</th><th>Amount</th><th>Note</th></tr>
<tr><td>User pays</td><td class="num">$2.00</td><td>Plus local sales tax where it applies, which Google collects and remits.</td></tr>
<tr><td>Google Play's share</td><td class="num">about −$0.30</td><td>About 15% when you use Play's billing. Since 30 June 2026, in the US, UK and EEA this is a 10% service fee plus a 5% billing fee; other countries are moving to the new structure in stages.</td></tr>
<tr><td>RevenueCat</td><td class="num">$0</td><td>Free until $2,500 a month, then 1%.</td></tr>
<tr><td>You keep</td><td class="num">about $1.70</td><td>Before your own income tax.</td></tr></table>
<div class="grid3"><div class="card"><div class="big">$170<small>per month from 100 Pro users</small></div></div><div class="card"><div class="big">$1,700<small>per month from 1,000 Pro users</small></div></div><div class="card"><div class="big">$8,500<small>per month from 5,000 Pro users</small></div></div></div>
<p>These are arithmetic, not a forecast. How many free users become Pro depends on the app's quality and your marketing; the funnel in your admin panel shows your real rate. Ad income is on top and varies widely by country, so treat it as a bonus until you have a month of your own AdMob data.</p>

{h2('03', 'How the money reaches you in Pakistan')}
<table class="t"><tr><th></th><th>Google Play (subscriptions)</th><th>AdMob (ads)</th></tr>
<tr><td>Method</td><td>Wire transfer to your bank account. Pakistan is on Google's supported list.</td><td>Wire transfer to your bank account.</td></tr>
<tr><td>Minimum</td><td class="num">US$100 balance</td><td>Shown in your AdMob account; $100 is typical.</td></tr>
<tr><td>When</td><td>Monthly, for the previous month's sales.</td><td>Around the 21st of the month after you cross the threshold.</td></tr>
<tr><td>Currency</td><td>Sent in USD. A USD account avoids a forced conversion.</td><td>Depends on your payments profile.</td></tr>
<tr><td>Before the first payout</td><td>Verify identity and add bank details (SWIFT code, IBAN) in the payments profile.</td><td>Tax info, identity check, and a PIN posted to your address (2 to 3 weeks). No PIN, no payment.</td></tr>
<tr><td>Bank charges</td><td>Your bank's incoming-wire fee, anywhere from $0 to $50.</td><td>Same.</td></tr></table>
<div class="card"><h3>Practical setup</h3><p>Use one bank account for both. Ask your bank for its SWIFT code, whether it needs an intermediary bank for USD wires, and what it charges per incoming wire. Because each wire can carry a fixed fee, small monthly amounts lose a bigger share; that is normal in the first months. Keep the bank's payment advice for every transfer for your tax records. This is general information, not tax or legal advice; a local accountant can tell you how export-of-services income is treated.</p></div>

{h2('04', 'What it costs')}
<table class="t"><tr><th>Item</th><th>Cost</th><th>When</th></tr>
<tr><td>Google Play developer account</td><td class="num">$25</td><td>Once</td></tr>
<tr><td>Firebase, AdMob, GitHub, admin hosting</td><td class="num">$0</td><td>Free plans cover launch scale</td></tr>
<tr><td>RevenueCat</td><td class="num">$0</td><td>1% only above $2,500 a month</td></tr>
<tr><td>Privacy policy page</td><td class="num">$0</td><td>Same free host as the admin panel</td></tr>
<tr><td>A domain name (optional, looks professional)</td><td class="num">about $10 to $15</td><td>Per year</td></tr>
<tr><td>Apple Developer Program (only for iPhone)</td><td class="num">$99</td><td>Per year</td></tr>
<tr><td>Cloud Mac build service (only for iPhone, if no Mac)</td><td class="num">varies</td><td>Price it when you start the iOS version</td></tr></table>
<div class="grid2"><div class="card lime"><div class="big">$25<small>to launch on Android with zero marketing spend</small></div></div><div class="card"><div class="big">$124+<small>first year if you add iPhone</small></div></div></div>
<h3>Marketing budget: three levels</h3>
<table class="t"><tr><th>Level</th><th>Spend</th><th>What it buys</th></tr>
<tr><td>Organic</td><td class="num">$0</td><td>Your own channels, short videos, Reddit and community posts, store optimisation. Start here.</td></tr>
<tr><td>Boost</td><td class="num">$50 to $150 / month</td><td>Promote the two best-performing videos; send gifted Pro to 10 small creators.</td></tr>
<tr><td>Paid installs</td><td class="num">$300+ / month</td><td>Google App Campaigns. Only after the funnel shows a user is worth more than an install costs.</td></tr></table>
<p>These marketing figures are planning suggestions, not quotes. Break-even on the $25 is 15 Pro subscribers for one month.</p>

{h2('05', 'Who it is for, and the one-line pitch')}
<div class="card lime"><h3>"Record anywhere. One tap. It sounds like a studio."</h3><p>Lead with the before/after. Nobody searches for "spectral noise removal"; they search for "remove background noise from voice recording".</p></div>
<table class="t"><tr><th>Audience</th><th>Their problem</th><th>Hook</th></tr>
<tr><td>Content creators, reel and podcast makers</td><td>Fan, traffic and room echo in voiceovers</td><td>"I recorded this next to a fan. Listen after one tap."</td></tr>
<tr><td>Students</td><td>Lecture recordings they cannot hear clearly</td><td>"Back-bench recording, front-row sound."</td></tr>
<tr><td>Journalists, interviewers, researchers</td><td>Noisy cafés and streets</td><td>"Clean the interview before you transcribe it."</td></tr>
<tr><td>Musicians and voice-note people</td><td>Hiss on song ideas</td><td>"Keep the idea, lose the hiss."</td></tr>
<tr><td>Fun and family</td><td>They want to play</td><td>Robot, Monster, Chipmunk effects on a kid's voice.</td></tr></table>

{h2('06', 'Store optimisation')}
<ul><li><b>Title:</b> Clear Audio Recorder: Noise Remover</li><li><b>Keywords to work into the description naturally:</b> voice recorder, noise remover, remove background noise, audio cleaner, voice changer, MP3 recorder, podcast recorder, lecture recorder.</li><li><b>First screenshot:</b> the Before/After waveform with the line "One tap. Noise gone." Most people decide from the first two images.</li><li><b>Screenshot order:</b> before/after → record screen → voice effects → folders → Send to PC.</li><li><b>Reviews:</b> reply to every review in the first month. Ask happy testers to rate after launch day, not before.</li><li><b>Localise the listing</b> into Spanish, Portuguese, Hindi, Indonesian and Arabic once English works. Play lets you add translations without changing the app.</li></ul>

{h2('07', 'A 30-day launch plan')}
<table class="t"><tr><th>Days</th><th>Do this</th></tr>
<tr><td>1 to 14 · closed test</td><td>12+ testers on the closed track. Record 10 before/after clips in real places: rickshaw, café, rooftop, next to a generator. These clips are your whole content bank.</td></tr>
<tr><td>15 · launch day</td><td>Post the best before/after on both YouTube channels, Instagram, TikTok and LinkedIn with the Play link. Announce in the admin panel. Message every tester to rate the app.</td></tr>
<tr><td>16 to 22</td><td>One short video a day. Same format every time: noisy clip, tap, clean clip, app name. Post in creator, podcast and student communities where self-promotion is allowed, with the clip, not just a link.</td></tr>
<tr><td>23 to 30</td><td>Gift Pro to 10 small creators (5k to 50k followers) from the admin panel and ask for an honest demo. Read the funnel and change one thing: free seconds, or the first screenshot.</td></tr></table>
<h3>Ten video ideas</h3>
<ol><li>"I recorded this beside a generator" before/after.</li><li>Street interview cleaned in one tap.</li><li>Phone mic vs a $100 mic after cleaning.</li><li>Turning a lecture recording into something you can study from.</li><li>My voice as Robot, Monster and Chipmunk.</li><li>Record with the volume button without touching the screen.</li><li>Send a recording to your laptop with no cable and no internet.</li><li>How I made a podcast intro on my phone.</li><li>Light vs Medium vs Strong: which one to use.</li><li>"This app never uploads your recordings" privacy angle.</li></ol>

{h2('08', 'Raising revenue once people are using it')}
<ul><li><b>Watch one number a week:</b> of the people who use all their free seconds, how many subscribe. That is the Pro screen's conversion rate.</li><li><b>Tune free seconds.</b> If under a third of signed-in users ever hit the limit, lower it or keep it and improve onboarding. If many hit it and few pay, the price or the Pro screen is the issue, not the limit.</li><li><b>Add a yearly plan</b> at $14.99 in Play Console and RevenueCat. Yearly payers churn far less. The app needs a small update to show both plans; ask Claude when you are ready.</li><li><b>Use the announcement line</b> for limited offers and new features.</li><li><b>Next features that justify Pro:</b> an on-device AI voice-isolation mode, trimming, and batch cleaning.</li><li><b>Keep ads gentle.</b> One full-screen ad after an export is tolerable; ads during recording would cost you ratings.</li></ul>
<div class="foot">Sources: Google Play fee changes (android-developers.googleblog.com/2026/06/play-expanded-billing.html), Google Play wire payouts (support.google.com/googleplay/android-developer/answer/2700656), AdMob payments (support.google.com/admob/answer/3001017), Apple Developer Program fee (developer.apple.com/programs), Firebase pricing. Checked 10 November 2026. Earnings examples are illustrations, not predictions.</div>
''')

async def main():
    files = [('2026-11-10-clear-1-owner-and-admin-guide', owner), ('2026-11-10-clear-2-launch-guide', launch), ('2026-11-10-clear-3-money-and-growth-guide', money)]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page()
        for name, html in files:
            await pg.set_content(html, wait_until='load'); await pg.wait_for_timeout(600)
            await pg.pdf(path=os.path.join(OUT, name + '.pdf'), print_background=True, prefer_css_page_size=True)
            print('wrote', name + '.pdf')
        await b.close()
asyncio.run(main())
