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
import { db, handleFirestoreError, OperationType, isFirestoreOfflineGlobal } from '../firebase';
import { UserProfile, Appointment, ClinicalRecord, Message, AppointmentStatus } from '../types';

// --- Local Storage Collections Engine ---
export function getLocalCollection<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveLocalCollection<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch a custom event so other components (like App.tsx) can update their states in real-time
    window.dispatchEvent(new Event('local-db-updated'));
  } catch (e) {}
}

// Seed mock clinical data for local/offline testing
export function seedLocalData() {
  try {
    const users = getLocalCollection<UserProfile>('local_users');
    const appointments = getLocalCollection<Appointment>('local_appointments');
    const records = getLocalCollection<ClinicalRecord>('local_clinicalRecords');
    const messages = getLocalCollection<Message>('local_messages');

    if (users.length === 0) {
      const therapistDemo: UserProfile = {
        uid: 'therapist_demo',
        name: 'Dra. Alejandra Ruiz',
        email: 'alejandra.ruiz@clinicasinergia.com',
        role: 'therapist',
        phone: '+52 (55) 5555-4321',
        photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
        createdAt: new Date().toISOString()
      };
      const patientDemo: UserProfile = {
        uid: 'patient_demo',
        name: 'Mateo González',
        email: 'mateo.gonzalez@gmail.com',
        role: 'patient',
        phone: '+52 (55) 5555-8765',
        photoURL: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&q=80&w=200',
        createdAt: new Date().toISOString()
      };
      saveLocalCollection('local_users', [therapistDemo, patientDemo]);
    }

    if (appointments.length === 0) {
      const appt1: Appointment = {
        id: 'appt_1',
        patientId: 'patient_demo',
        patientName: 'Mateo González',
        therapistId: 'therapist_demo',
        therapistName: 'Dra. Alejandra Ruiz',
        therapyType: 'Terapia Ocupacional e Integración Sensorial',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: '16:00',
        status: 'pending',
        notes: 'Evaluación de procesamiento sensorial táctil y propioceptivo.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const appt2: Appointment = {
        id: 'appt_2',
        patientId: 'patient_demo',
        patientName: 'Mateo González',
        therapistId: 'therapist_demo',
        therapistName: 'Dra. Alejandra Ruiz',
        therapyType: 'Terapia del Habla y Lenguaje',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        time: '10:00',
        status: 'completed',
        notes: 'Sesión de articulación del fonema /r/. Muestra excelente disposición.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveLocalCollection('local_appointments', [appt1, appt2]);
    }

    if (records.length === 0) {
      const rec1: ClinicalRecord = {
        id: 'rec_1',
        patientId: 'patient_demo',
        therapistId: 'therapist_demo',
        therapistName: 'Dra. Alejandra Ruiz',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        therapyType: 'Terapia Ocupacional',
        objective: 'Trastorno del Procesamiento Sensorial (Buscador táctil). Circuitos motrices con carga de peso.',
        evolution: 'El paciente completó el circuito motriz con asistencia mínima. Muestra mayor tolerancia al estímulo táctil y mejor regulación conductual después de la presión profunda.',
        recommendations: 'Continuar técnicas de cepillado táctil y masajes de presión profunda.',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      };
      saveLocalCollection('local_clinicalRecords', [rec1]);
    }

    if (messages.length === 0) {
      const msg1: Message = {
        id: 'msg_1',
        senderId: 'therapist_demo',
        senderName: 'Dra. Alejandra Ruiz',
        receiverId: 'patient_demo',
        text: 'Hola, recuerden traer ropa cómoda y calcetines antideslizantes para la sesión de Mateo mañana.',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      };
      const msg2: Message = {
        id: 'msg_2',
        senderId: 'patient_demo',
        senderName: 'Mateo González',
        receiverId: 'therapist_demo',
        text: 'Hola Dra. Alejandra, claro que sí, los llevaremos. ¡Muchas gracias por el recordatorio!',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      };
      saveLocalCollection('local_messages', [msg1, msg2]);
    }
  } catch (e) {
    console.error("Error seeding local data:", e);
  }
}

// Run the seed immediately so we always have fallback content populated
seedLocalData();

// --- Users Functions ---
export async function createUserProfile(profile: Omit<UserProfile, 'createdAt'>): Promise<void> {
  const path = `users/${profile.uid}`;
  const fullProfile = {
    ...profile,
    createdAt: new Date().toISOString()
  };

  // Always save locally first
  const users = getLocalCollection<UserProfile>('local_users');
  const index = users.findIndex(u => u.uid === profile.uid);
  if (index >= 0) {
    users[index] = fullProfile;
  } else {
    users.push(fullProfile);
  }
  saveLocalCollection('local_users', users);

  try {
    const userRef = doc(db, 'users', profile.uid);
    await setDoc(userRef, fullProfile);
  } catch (error) {
    console.warn("Offline: failed to save user profile to Firestore, saved locally:", error);
    // Mark as offline if appropriate but don't crash
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('failed to get document')) {
      try { localStorage.setItem('is_firestore_offline', 'true'); } catch (e) {}
    }
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      // Cache locally
      const users = getLocalCollection<UserProfile>('local_users');
      const index = users.findIndex(u => u.uid === uid);
      if (index >= 0) {
        users[index] = data;
      } else {
        users.push(data);
      }
      saveLocalCollection('local_users', users);
      return data;
    }
  } catch (error) {
    console.warn("Offline: failed to fetch user profile, using local fallback:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('failed to get document')) {
      try { localStorage.setItem('is_firestore_offline', 'true'); } catch (e) {}
    }
  }

  // Fallback to local storage
  const users = getLocalCollection<UserProfile>('local_users');
  const localUser = users.find(u => u.uid === uid);
  return localUser || null;
}

// --- Appointments Functions ---
export async function createAppointment(appointment: Omit<Appointment, 'createdAt' | 'updatedAt'>): Promise<void> {
  const path = `appointments/${appointment.id}`;
  const fullAppointment = {
    ...appointment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Always save locally first
  const list = getLocalCollection<Appointment>('local_appointments');
  const index = list.findIndex(item => item.id === appointment.id);
  if (index >= 0) {
    list[index] = fullAppointment;
  } else {
    list.push(fullAppointment);
  }
  saveLocalCollection('local_appointments', list);

  try {
    const appointmentRef = doc(db, 'appointments', appointment.id);
    await setDoc(appointmentRef, fullAppointment);
  } catch (error) {
    console.warn("Offline: failed to save appointment to Firestore, saved locally:", error);
  }
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
  const path = `appointments/${id}`;
  
  // Always update locally first
  const list = getLocalCollection<Appointment>('local_appointments');
  const index = list.findIndex(item => item.id === id);
  if (index >= 0) {
    list[index] = {
      ...list[index],
      status,
      updatedAt: new Date().toISOString()
    };
    saveLocalCollection('local_appointments', list);
  }

  try {
    const appointmentRef = doc(db, 'appointments', id);
    await updateDoc(appointmentRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn("Offline: failed to update appointment in Firestore, saved locally:", error);
  }
}

// --- Clinical Records Functions ---
export async function createClinicalRecord(record: Omit<ClinicalRecord, 'createdAt'>): Promise<void> {
  const path = `clinicalRecords/${record.id}`;
  const fullRecord = {
    ...record,
    createdAt: new Date().toISOString()
  };

  // Always save locally first
  const list = getLocalCollection<ClinicalRecord>('local_clinicalRecords');
  const index = list.findIndex(item => item.id === record.id);
  if (index >= 0) {
    list[index] = fullRecord;
  } else {
    list.push(fullRecord);
  }
  saveLocalCollection('local_clinicalRecords', list);

  try {
    const recordRef = doc(db, 'clinicalRecords', record.id);
    await setDoc(recordRef, fullRecord);
  } catch (error) {
    console.warn("Offline: failed to save clinical record to Firestore, saved locally:", error);
  }
}

// --- Messaging Functions ---
export async function sendMessage(senderId: string, senderName: string, receiverId: string, text: string): Promise<void> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const path = `messages/${messageId}`;
  const fullMsg = {
    id: messageId,
    senderId,
    senderName,
    receiverId,
    text,
    createdAt: new Date().toISOString()
  };

  // Always save locally first
  const list = getLocalCollection<Message>('local_messages');
  list.push(fullMsg);
  saveLocalCollection('local_messages', list);

  try {
    const messageRef = doc(db, 'messages', messageId);
    await setDoc(messageRef, fullMsg);
  } catch (error) {
    console.warn("Offline: failed to send message to Firestore, saved locally:", error);
  }
}
