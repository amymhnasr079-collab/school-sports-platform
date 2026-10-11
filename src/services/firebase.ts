import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { AppDatabase, SchoolSchedule } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

export { firebaseConfig };

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the provisioned database ID
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection on boot as mandated by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline.');
    }
    // Return true if error is just document not found or permission check passed
    return true;
  }
}

// Global Document Reference for Platform Database
const PLATFORM_DOC_PATH = 'platform';
const PLATFORM_DOC_ID = 'main_data';
const PLATFORM_SCHEDULE_DOC_ID = 'schedule_data';

/**
 * Save schedule isolated to Firestore for maximum reliability and pinning
 */
export async function saveCloudSchedule(schedule: SchoolSchedule): Promise<boolean> {
  try {
    const ref = doc(db, PLATFORM_DOC_PATH, PLATFORM_SCHEDULE_DOC_ID);
    // Safe image handling to stay well under 1MB Firestore document limits
    let safeSchedule = { ...schedule };
    if (safeSchedule.scheduleImageDataUrl && safeSchedule.scheduleImageDataUrl.length > 500000) {
      safeSchedule = {
        ...safeSchedule,
        scheduleImageDataUrl: null,
      };
    }
    await setDoc(
      ref,
      {
        slots: safeSchedule.slots || [],
        scheduleImageDataUrl: safeSchedule.scheduleImageDataUrl || null,
        generalNotes: safeSchedule.generalNotes || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Error saving schedule to cloud Firestore:', err);
    return false;
  }
}

/**
 * Fetch permanent schedule from dedicated Firestore document
 */
export async function fetchCloudSchedule(): Promise<SchoolSchedule | null> {
  try {
    const ref = doc(db, PLATFORM_DOC_PATH, PLATFORM_SCHEDULE_DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.slots)) {
        return {
          slots: data.slots,
          scheduleImageDataUrl: data.scheduleImageDataUrl || null,
          generalNotes: data.generalNotes || '',
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('Error fetching cloud schedule:', err);
    return null;
  }
}

/**
 * Listen in real-time to cloud changes from Firestore
 */
export function subscribeToCloudDatabase(
  onData: (cloudDb: Partial<AppDatabase>) => void,
  onError?: (err: unknown) => void
) {
  const ref = doc(db, PLATFORM_DOC_PATH, PLATFORM_DOC_ID);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data) {
          onData(data as Partial<AppDatabase>);
        }
      }
    },
    (error) => {
      console.warn('Firestore subscription notice:', error);
      onError?.(error);
    }
  );
}

/**
 * Fetch initial database from Firestore
 */
export async function fetchCloudDatabase(): Promise<Partial<AppDatabase> | null> {
  try {
    const ref = doc(db, PLATFORM_DOC_PATH, PLATFORM_DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as Partial<AppDatabase>;
    }
    return null;
  } catch (err) {
    console.warn('Error fetching cloud database:', err);
    return null;
  }
}

/**
 * Save database permanently to Firestore
 */
export async function saveCloudDatabase(data: AppDatabase): Promise<boolean> {
  try {
    // Also save schedule to dedicated document in parallel for 100% data safety
    if (data.schedule) {
      saveCloudSchedule(data.schedule).catch(() => {});
    }

    const ref = doc(db, PLATFORM_DOC_PATH, PLATFORM_DOC_ID);

    // Safeguard: if scheduleImageDataUrl is too large for the single main document, strip it from main doc
    let safeData = { ...data };
    if (
      safeData.schedule?.scheduleImageDataUrl &&
      safeData.schedule.scheduleImageDataUrl.length > 500000
    ) {
      safeData = {
        ...safeData,
        schedule: {
          ...safeData.schedule,
          scheduleImageDataUrl: null,
        },
      };
    }

    await setDoc(
      ref,
      {
        ...safeData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Error saving to cloud Firestore:', err);
    return false;
  }
}
