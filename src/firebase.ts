import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';

// Safe access to Vite environment variables for TypeScript linter
const metaEnv = (import.meta as any).env || {};

// Check for custom config saved in localStorage (e.g., entered by user for clinicaterapias-23ef8)
let customConfig: any = null;
try {
  const saved = localStorage.getItem('custom_firebase_config');
  if (saved) {
    let parsed = JSON.parse(saved);
    // Automatically sanitize and migrate any stored config with the extra 's' typo "clinicasterapias" to "clinicaterapias"
    if (parsed && parsed.projectId && parsed.projectId.includes('clinicasterapias')) {
      console.log('Migrating custom project ID in localStorage from clinicasterapias to clinicaterapias');
      parsed.projectId = parsed.projectId.replace('clinicasterapias', 'clinicaterapias');
      if (parsed.authDomain) {
        parsed.authDomain = parsed.authDomain.replace('clinicasterapias', 'clinicaterapias');
      }
      if (parsed.storageBucket) {
        parsed.storageBucket = parsed.storageBucket.replace('clinicasterapias', 'clinicaterapias');
      }
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
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
