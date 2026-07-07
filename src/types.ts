export type UserRole = 'patient' | 'therapist' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  photoURL?: string;
  createdAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  therapyType: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  therapistId: string;
  therapistName: string;
  date: string; // YYYY-MM-DD
  therapyType: string;
  objective: string;
  evolution: string;
  recommendations: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export const THERAPY_TYPES = [
  'Fisioterapia',
  'Terapia Ocupacional',
  'Terapia de Lenguaje / Habla',
  'Psicoterapia / Psicología Infantil',
  'Integración Sensorial',
  'Estimulación Temprana',
  'Neurorehabilitación'
];

export const THERAPISTS = [
  { uid: 'therapist_maria', name: 'Lic. María Fernández', specialty: 'Fisioterapia & Integración Sensorial' },
  { uid: 'therapist_carlos', name: 'Lic. Carlos Mendoza', specialty: 'Terapia Ocupacional' },
  { uid: 'therapist_ana', name: 'Dra. Ana Restrepo', specialty: 'Psicología Infantil' },
  { uid: 'therapist_sofia', name: 'Lic. Sofía Valenzuela', specialty: 'Terapia de Lenguaje' }
];
