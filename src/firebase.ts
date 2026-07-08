import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';

// Safe access to Vite environment variables for TypeScript linter
const metaEnv = (import.meta as any).env || {};

// Check for custom config saved in localStorage (e.g., entered by user for bdclinica-nuevo)
let customConfig: any = null;
try {
  const saved = localStorage.getItem('custom_firebase_config');
  if (saved) {
    let parsed = JSON.parse(saved);
    // Automatically sanitize and migrate any stored config with the extra 's' typo to "bdclinica-nuevo"
    if (parsed && parsed.projectId && (parsed.projectId.includes('clinicasterapias') || parsed.projectId.includes('clinicaterapias'))) {
      console.log('Migrating custom project ID in localStorage to bdclinica-nuevo');
      parsed.projectId = 'bdclinica-nuevo';
      parsed.authDomain = 'bdclinica-nuevo.firebaseapp.com';
      parsed.storageBucket = 'bdclinica-nuevo.firebasestorage.app';
      parsed.messagingSenderId = '346136074960';
      parsed.appId = '1:346136074960:web:0180e7135718b65597c427';
      localStorage.setItem('custom_firebase_config', JSON.stringify(parsed));
    }
    customConfig = parsed;
  }
} catch (e) {
  console.error('Error reading custom firebase config:', e);
}

// Support dynamic overrides via environment variables or localStorage without merging custom and default fields
let resolvedConfig: any;

if (customConfig) {
  resolvedConfig = {
    apiKey: customConfig.apiKey,
    authDomain: customConfig.authDomain || `${customConfig.projectId}.firebaseapp.com`,
    projectId: customConfig.projectId,
    storageBucket: customConfig.storageBucket || `${customConfig.projectId}.firebasestorage.app`,
    messagingSenderId: customConfig.messagingSenderId || "",
    appId: customConfig.appId || "",
    firestoreDatabaseId: customConfig.firestoreDatabaseId || "(default)"
  };
} else if (metaEnv.VITE_FIREBASE_PROJECT_ID) {
  resolvedConfig = {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || "",
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || `${metaEnv.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || `${metaEnv.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: metaEnv.VITE_FIREBASE_APP_ID || "",
    firestoreDatabaseId: metaEnv.VITE_FIREBASE_DATABASE_ID || "(default)"
  };
} else {
  resolvedConfig = {
    apiKey: defaultFirebaseConfig.apiKey,
    authDomain: defaultFirebaseConfig.authDomain,
    projectId: defaultFirebaseConfig.projectId,
    storageBucket: defaultFirebaseConfig.storageBucket,
    messagingSenderId: defaultFirebaseConfig.messagingSenderId,
    appId: defaultFirebaseConfig.appId,
    firestoreDatabaseId: defaultFirebaseConfig.firestoreDatabaseId || "(default)"
  };
}

export const firebaseConfig = resolvedConfig;

const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export function saveCustomFirebaseConfig(config: any) {
  try {
    localStorage.setItem('custom_firebase_config', JSON.stringify(config));
    window.location.reload();
  } catch (e) {
    console.error('Error saving custom config:', e);
  }
}

export function clearCustomFirebaseConfig() {
  try {
    localStorage.removeItem('custom_firebase_config');
    window.location.reload();
  } catch (e) {
    console.error('Error clearing custom config:', e);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export let isFirestoreOfflineGlobal = false;
try {
  isFirestoreOfflineGlobal = localStorage.getItem('is_firestore_offline') === 'true';
} catch (e) {}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('client is offline') || errMsg.toLowerCase().includes('failed to get document')) {
    isFirestoreOfflineGlobal = true;
    try {
      localStorage.setItem('is_firestore_offline', 'true');
    } catch (e) {}
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isFirestoreOfflineGlobal = false;
    localStorage.setItem('is_firestore_offline', 'false');
  } catch (error) {
    isFirestoreOfflineGlobal = true;
    try {
      localStorage.setItem('is_firestore_offline', 'true');
    } catch (e) {}
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
