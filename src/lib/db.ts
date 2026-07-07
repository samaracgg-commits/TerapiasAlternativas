import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Appointment, ClinicalRecord, Message, AppointmentStatus } from '../types';

// --- Users Functions ---
export async function createUserProfile(profile: Omit<UserProfile, 'createdAt'>): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, {
      ...profile,
      createdAt: new Date().toISOString() // Using ISO string or Firestore timestamp
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// --- Appointments Functions ---
export async function createAppointment(appointment: Omit<Appointment, 'createdAt' | 'updatedAt'>): Promise<void> {
  const path = `appointments/${appointment.id}`;
  try {
    const appointmentRef = doc(db, 'appointments', appointment.id);
    await setDoc(appointmentRef, {
      ...appointment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const path = `appointments/${id}`;
  try {
    const appointmentRef = doc(db, 'appointments', id);
    await updateDoc(appointmentRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Clinical Records Functions ---
export async function createClinicalRecord(record: Omit<ClinicalRecord, 'createdAt'>): Promise<void> {
  const path = `clinicalRecords/${record.id}`;
  try {
    const recordRef = doc(db, 'clinicalRecords', record.id);
    await setDoc(recordRef, {
      ...record,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// --- Messaging Functions ---
export async function sendMessage(senderId: string, senderName: string, receiverId: string, text: string): Promise<void> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const path = `messages/${messageId}`;
  try {
    const messageRef = doc(db, 'messages', messageId);
    await setDoc(messageRef, {
      id: messageId,
      senderId,
      senderName,
      receiverId,
      text,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
