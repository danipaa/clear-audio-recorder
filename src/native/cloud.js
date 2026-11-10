// Accounts + cloud sync (Firebase free plan). No server of our own: the app talks straight
// to Firebase, and Firestore security rules (firebase/firestore.rules) decide who can read what.
// Audio never goes through here. Only the account profile, plan, folders, settings and counters.
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, GoogleAuthProvider, signInWithCredential, signOut as fbSignOut, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, increment, deleteField, serverTimestamp } from 'firebase/firestore/lite';
import { SocialLogin } from '@capgo/capacitor-social-login';

const withTimeout = (p, ms, fallback) => Promise.race([p, new Promise(res => setTimeout(() => res(fallback), ms))]);
const today = () => new Date().toISOString().slice(0, 10);

export function createCloud(CONFIG, platformName) {
  const fc = CONFIG.firebase || {};
  const available = !!(fc.apiKey && fc.projectId && fc.appId && CONFIG.googleWebClientId);
  if (!available) {
    return { available: false, async init() { }, user: () => null, async getConfig() { return null; } };
  }
  let auth = null, db = null, knownDays = [];
  const KEEP_DAYS = 35; // per-day activity kept on the profile for the admin charts
  const view = u => u ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' } : null;
  const userRef = () => doc(db, 'users', auth.currentUser.uid);

  async function googleCredential() {
    const res = await SocialLogin.login({ provider: 'google', options: {} });
    const idToken = res && res.result && res.result.idToken;
    if (!idToken) throw new Error('Google did not return a sign-in token.');
    return GoogleAuthProvider.credential(idToken);
  }

  return {
    available: true,
    async init() {
      const app = initializeApp(fc);
      auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
      db = getFirestore(app);
      await SocialLogin.initialize({ google: { webClientId: CONFIG.googleWebClientId } });
      await withTimeout(auth.authStateReady(), 4000);
    },
    user: () => view(auth && auth.currentUser),
    async signIn() {
      try {
        await signInWithCredential(auth, await googleCredential());
        return { ok: true, user: view(auth.currentUser) };
      } catch (e) {
        const msg = String((e && e.message) || e);
        if (/cancel|dismiss|closed/i.test(msg)) return { ok: false, quiet: true };
        return { ok: false, message: 'Sign-in didn\'t work. Check your connection and try again.' };
      }
    },
    async signOut() {
      try { await SocialLogin.logout({ provider: 'google' }); } catch (e) { }
      await fbSignOut(auth);
    },
    // Removes the user's profile, activity history and sign-in record. Required by Google Play.
    async deleteAccount() {
      const u = auth.currentUser; if (!u) return { ok: false };
      const wipe = async () => {
        await deleteDoc(doc(db, 'users', u.uid));
        await deleteUser(u);
      };
      try { await wipe(); }
      catch (e) {
        if (e && e.code === 'auth/requires-recent-login') {
          try { await signInWithCredential(auth, await googleCredential()); await deleteUser(auth.currentUser); }
          catch (e2) { return { ok: false, message: 'Please sign in again, then delete your account.' }; }
        } else return { ok: false, message: 'Couldn\'t delete the account. Check your connection and try again.' };
      }
      try { await SocialLogin.logout({ provider: 'google' }); } catch (e) { }
      return { ok: true };
    },
    async pull() {
      if (!auth.currentUser) return null;
      const snap = await getDoc(userRef());
      const data = snap.exists() ? snap.data() : null;
      knownDays = data && data.days ? Object.keys(data.days) : [];
      return data;
    },
    // `profile` holds only fields the security rules let a user write.
    async push(profile, isNew) {
      const u = auth.currentUser; if (!u) return;
      const data = { ...profile, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '', platform: platformName, appVersion: CONFIG.appVersion, lastActive: serverTimestamp() };
      if (isNew) data.createdAt = serverTimestamp();
      const cutoff = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString().slice(0, 10);
      const old = knownDays.filter(d => d < cutoff);
      if (old.length) { data.days = {}; for (const d of old) data.days[d] = deleteField(); knownDays = knownDays.filter(d => d >= cutoff); }
      await setDoc(userRef(), data, { merge: true });
    },
    // counts: { opens, records, cleans, cleanSeconds, exports }
    async track(counts) {
      const u = auth.currentUser; if (!u) return;
      const inc = {}; for (const k of Object.keys(counts)) if (counts[k]) inc[k] = increment(counts[k]);
      if (!Object.keys(inc).length) return;
      await setDoc(userRef(), { days: { [today()]: inc } }, { merge: true });
    },
    async getConfig() {
      try { const snap = await withTimeout(getDoc(doc(db, 'config', 'app')), 4000, null); return snap && snap.exists() ? snap.data() : null; }
      catch (e) { return null; }
    },
  };
}
