import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';

// Local storage key for fallback profile data
const LOCAL_USER_PROFILE_KEY = 'knihovnicka_user_profile';

export async function registerUser(email, password, displayName, location) {
  if (!isFirebaseConfigured) {
    // Fallback local registration for testing/demo mode
    const fakeUid = 'user_' + Date.now();
    const userProfile = {
      uid: fakeUid,
      email,
      displayName: displayName || email.split('@')[0],
      location: location || 'Nespecifikováno',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_USER_PROFILE_KEY, JSON.stringify(userProfile));
    return { user: { uid: fakeUid, email }, profile: userProfile };
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const cleanDisplayName = displayName || email.split('@')[0];
  await updateProfile(user, { displayName: cleanDisplayName });

  const profileData = {
    uid: user.uid,
    email: user.email,
    displayName: cleanDisplayName,
    location: location || 'Nespecifikováno',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', user.uid), profileData);
  } catch (err) {
    console.error('Chyba při ukládání profilu uživatele do Firestore:', err);
  }

  return { user, profile: profileData };
}

export async function loginUser(email, password) {
  if (!isFirebaseConfigured) {
    const userProfile = {
      uid: 'user_demo',
      email,
      displayName: email.split('@')[0],
      location: 'Ostrava-Poruba',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_USER_PROFILE_KEY, JSON.stringify(userProfile));
    return { user: { uid: 'user_demo', email }, profile: userProfile };
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const profile = await fetchUserProfile(user.uid, user.email, user.displayName);
  return { user, profile };
}

export async function logoutUser() {
  if (!isFirebaseConfigured) {
    localStorage.removeItem(LOCAL_USER_PROFILE_KEY);
    return;
  }
  await signOut(auth);
}

export async function fetchUserProfile(uid, fallbackEmail = '', fallbackDisplayName = '') {
  if (!isFirebaseConfigured) {
    try {
      const stored = localStorage.getItem(LOCAL_USER_PROFILE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      uid,
      email: fallbackEmail,
      displayName: fallbackDisplayName || fallbackEmail.split('@')[0],
      location: 'Ostrava-Poruba'
    };
  }

  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      const defaultProfile = {
        uid,
        email: fallbackEmail,
        displayName: fallbackDisplayName || fallbackEmail.split('@')[0],
        location: 'Nespecifikováno',
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, defaultProfile);
      return defaultProfile;
    }
  } catch (err) {
    console.error('Chyba při načítání profilu uživatele z Firestore:', err);
    return {
      uid,
      email: fallbackEmail,
      displayName: fallbackDisplayName || fallbackEmail.split('@')[0],
      location: 'Nespecifikováno'
    };
  }
}

export async function updateUserProfile(uid, { displayName, location }) {
  if (!isFirebaseConfigured) {
    try {
      const stored = localStorage.getItem(LOCAL_USER_PROFILE_KEY);
      const profile = stored ? JSON.parse(stored) : { uid };
      if (displayName !== undefined) profile.displayName = displayName;
      if (location !== undefined) profile.location = location;
      localStorage.setItem(LOCAL_USER_PROFILE_KEY, JSON.stringify(profile));
      return profile;
    } catch (e) {
      return { uid, displayName, location };
    }
  }

  const updates = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (location !== undefined) updates.location = location;

  if (auth.currentUser && displayName) {
    await updateProfile(auth.currentUser, { displayName });
  }

  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, updates);

  return fetchUserProfile(uid);
}

export function subscribeToAuthChanges(callback) {
  if (!isFirebaseConfigured) {
    try {
      const stored = localStorage.getItem(LOCAL_USER_PROFILE_KEY);
      if (stored) {
        const profile = JSON.parse(stored);
        callback({ uid: profile.uid, email: profile.email }, profile);
      } else {
        callback(null, null);
      }
    } catch (e) {
      callback(null, null);
    }
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await fetchUserProfile(user.uid, user.email, user.displayName);
      callback(user, profile);
    } else {
      callback(null, null);
    }
  });
}
