import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, CustomProvider } from 'firebase/app-check';

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ghostly-957aa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ghostly-957aa",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ghostly-957aa.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Initialize or reuse Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication
export const auth = getAuth(app);

// Cloud Firestore
export const db = getFirestore(app);

// Configure App Check with Debug Token support for Hackathon Judging & Local Dev
const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || "";
if (typeof window !== 'undefined') {
  (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}

let appCheckInstance = null;
if (typeof window !== 'undefined') {
  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new CustomProvider({
        getToken: () => {
          return Promise.resolve({
            token: debugToken,
            expireTimeMillis: Date.now() + 60 * 60 * 1000
          });
        }
      }),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn("App Check auto-init note: using debug fallback provider", err);
  }
}
export const appCheck = appCheckInstance;

// Helper for 1-click anonymous auth for hackathon judges & testers
export const ensureAuthenticatedUser = async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribe();
      if (currentUser) {
        resolve(currentUser);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          resolve(userCredential.user);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
};
