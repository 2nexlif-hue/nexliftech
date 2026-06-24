import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBE1lyrgC3niddjlNfLUm8qpp2uz53XEBk",
  authDomain: "nexliftech-1999c.firebaseapp.com",
  projectId: "nexliftech-1999c",
  storageBucket: "nexliftech-1999c.firebasestorage.app",
  messagingSenderId: "1017293392883",
  appId: "1:1017293392883:web:1a468650e06ac20e9de086",
  measurementId: "G-DR12HRX1PT"
};

const app = initializeApp(firebaseConfig);

// Only initialize analytics in the browser (not during SSR or build)
let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { analytics };
export default app;
