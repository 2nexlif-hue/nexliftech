import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile in Firestore
  async function syncUserProfile(user) {
    if (!user) {
      setUserProfile(null);
      return;
    }
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const emailLower = user.email ? user.email.toLowerCase().trim() : '';
      const isBotanyAdmin = (
        emailLower === 'aubidmalik00@gmail.com' ||
        emailLower === 'e.educational.24@gmail.com'
      );
      const isSuperAdmin = (
        emailLower === '2nexlif@gmail.com'
      );

      if (snap.exists()) {
        const existingData = snap.data();
        let needsUpdate = false;
        let role = existingData.role;
        let displayName = existingData.displayName;

        if (isBotanyAdmin && role !== 'botany_admin') {
          role = 'botany_admin';
          displayName = displayName || 'Dr. Aubid Hussain Malik';
          needsUpdate = true;
        } else if (isSuperAdmin && role !== 'admin') {
          role = 'admin';
          needsUpdate = true;
        }

        if (needsUpdate) {
          await setDoc(userRef, { role, displayName }, { merge: true });
          setUserProfile({ ...existingData, role, displayName });
        } else {
          setUserProfile(existingData);
        }
      } else {
        // When new user continues with Google or registers, student role is created by default
        const defaultRole = isBotanyAdmin ? 'botany_admin' : isSuperAdmin ? 'admin' : 'student';
        const displayName = isBotanyAdmin 
          ? (user.displayName || 'Dr. Aubid Hussain Malik')
          : isSuperAdmin 
          ? (user.displayName || 'Website Admin') 
          : (user.displayName || user.email.split('@')[0]);
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName,
          photoURL: user.photoURL || '',
          role: defaultRole,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile, { merge: true });
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Could not sync user profile in Firestore:', err);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await syncUserProfile(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, displayName = '') {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName });
    }
    await syncUserProfile(cred.user);
    return cred;
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    await syncUserProfile(cred.user);
    return cred;
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function logout() {
    return signOut(auth);
  }

  // Auto-logout admin users after 30 minutes of complete inactivity
  useEffect(() => {
    const isAdminRole = userProfile?.role === 'admin' || userProfile?.role === 'botany_admin';
    if (!currentUser || !isAdminRole) return;

    const TIMEOUT_DURATION = 30 * 60 * 1000;
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn('Admin session expired due to inactivity. Signing out.');
        logout();
      }, TIMEOUT_DURATION);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser, userProfile]);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    signup,
    signInWithGoogle,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
