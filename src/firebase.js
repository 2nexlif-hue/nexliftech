import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// SECURITY NOTE: These keys are intentionally public (client-side Firebase config).
// The actual security boundary is Firestore Security Rules configured in the
// Firebase Console. Ensure rules restrict writes to authenticated admin users only
// and validate data shapes for collections like 'contactMessages' and 'siteContent'.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);

// Analytics is useful, but it does not belong on the first render's critical path.
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  const startAnalytics = () => {
    import('firebase/analytics').then(({ getAnalytics, isSupported }) =>
      isSupported().then((supported) => {
        if (supported) getAnalytics(app);
      })
    ).catch((error) => console.warn('Analytics unavailable:', error));
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startAnalytics, { timeout: 5000 });
  } else {
    window.setTimeout(startAnalytics, 2500);
  }
}

export const db = getFirestore(app);
export default app;
