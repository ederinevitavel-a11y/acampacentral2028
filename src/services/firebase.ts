import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { WeeklyBulletin, AuthorizedUser } from '../types';
import { AUTHORIZED_GOOGLE_EMAILS, INITIAL_AUTHORIZED_USERS } from '../data/mockData';

// Initialize Firebase App with project credentials directly configured
const env = (import.meta as any).env || {};
const effectiveFirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAAxDIL0HfbT3BGhu38b-mylfgp1BeubTg",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "ibcip-comunhao.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "ibcip-comunhao",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "ibcip-comunhao.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "515197617981",
  appId: env.VITE_FIREBASE_APP_ID || "1:515197617981:web:de5ea0d3fe8bbd18262754",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-PYL341YEDX",
};

export const activeFirebaseConfig = effectiveFirebaseConfig;

const app = getApps().length > 0 ? getApp() : initializeApp(effectiveFirebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore (pass the specific databaseId if provided)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const BULLETIN_DOC_ID = 'current_bulletin';

// Subscribe to real-time bulletin updates from Firestore
export function subscribeToBulletin(onUpdate: (data: WeeklyBulletin) => void) {
  const docRef = doc(db, 'bulletins', BULLETIN_DOC_ID);
  
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as WeeklyBulletin;
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('Firestore subscription error, fallback local:', err);
    }
  );
}

// Save or publish bulletin to Firestore
export async function saveBulletinToFirestore(bulletin: WeeklyBulletin): Promise<void> {
  const docRef = doc(db, 'bulletins', BULLETIN_DOC_ID);
  await setDoc(docRef, bulletin, { merge: true });
}

// Fetch bulletin once
export async function fetchBulletinOnce(): Promise<WeeklyBulletin | null> {
  try {
    const docRef = doc(db, 'bulletins', BULLETIN_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as WeeklyBulletin;
    }
  } catch (err) {
    console.warn('Erro ao buscar documento inicial do Firestore:', err);
  }
  return null;
}

// Login with Google via Firebase Auth popup
export async function loginWithGoogleFirebase(): Promise<AuthorizedUser> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  const user = result.user;
  const userEmail = (user.email || '').trim().toLowerCase();

  if (!userEmail) {
    throw new Error('Não foi possível identificar o e-mail da sua conta Google.');
  }

  // Check authorization in whitelist
  const isAuthorized = AUTHORIZED_GOOGLE_EMAILS.some(
    (email) => email.trim().toLowerCase() === userEmail
  );

  if (!isAuthorized) {
    // If not authorized, sign out immediately
    await firebaseSignOut(auth);
    throw new Error(
      `A conta Google "${user.email}" foi autenticada com sucesso, mas NÃO está cadastrada na lista de administradores da IBCIP. Solicite a inclusão à liderança.`
    );
  }

  const existing = INITIAL_AUTHORIZED_USERS.find(
    (u) => u.email.toLowerCase() === userEmail
  );

  const authUser: AuthorizedUser = {
    id: user.uid,
    email: userEmail,
    name: user.displayName || existing?.name || userEmail.split('@')[0],
    role: existing?.role || 'Administrador',
    addedAt: existing?.addedAt || new Date().toISOString().split('T')[0],
    avatarUrl: user.photoURL || undefined,
  };

  return authUser;
}

// Sign out from Firebase
export async function logoutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

// Auth State observer
export function observeAuthState(
  onUserChanged: (user: AuthorizedUser | null) => void
) {
  return onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser || !firebaseUser.email) {
      onUserChanged(null);
      return;
    }

    const email = firebaseUser.email.trim().toLowerCase();
    const isAuthorized = AUTHORIZED_GOOGLE_EMAILS.some(
      (authEmail) => authEmail.trim().toLowerCase() === email
    );

    if (isAuthorized) {
      const existing = INITIAL_AUTHORIZED_USERS.find(
        (u) => u.email.toLowerCase() === email
      );
      onUserChanged({
        id: firebaseUser.uid,
        email: email,
        name: firebaseUser.displayName || existing?.name || email.split('@')[0],
        role: existing?.role || 'Administrador',
        addedAt: existing?.addedAt || new Date().toISOString().split('T')[0],
        avatarUrl: firebaseUser.photoURL || undefined,
      });
    } else {
      onUserChanged(null);
    }
  });
}
