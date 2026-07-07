import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Appointment, ClinicalRecord, Message, UserRole } from './types';
import { createUserProfile, getUserProfile } from './lib/db';

// Components
import { LandingPage } from './components/LandingPage';
import { AppointmentsPanel } from './components/AppointmentsPanel';
import { ClinicalRecordsPanel } from './components/ClinicalRecordsPanel';
import { MessagingPanel } from './components/MessagingPanel';
import { TherapyGuide } from './components/TherapyGuide';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { FloatingAIAssistant } from './components/FloatingAIAssistant';
import { LocationPanel } from './components/LocationPanel';

// Icons
import { 
  Heart, 
  Calendar, 
  FileText, 
  MessageSquare, 
  BookOpen, 
  LogOut, 
  User, 
  Users,
  ShieldCheck, 
  Sliders,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sun,
  Moon,
  MapPin
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'records' | 'messaging' | 'guide' | 'ai-assistant' | 'location'>('appointments');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Handle Email Magic Link Sign In
  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        setAuthLoading(true);
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Por favor, introduce tu correo electrónico para confirmar el inicio de sesión:');
        }
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            // Clean up the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (err: any) {
            console.error('Error signing in with email link:', err);
            alert('No se pudo verificar el enlace de acceso o ya ha expirado.');
          }
        }
        setAuthLoading(false);
      }
    };

    handleEmailLinkSignIn();
  }, []);

  // Real-time Data States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicalRecords, setClinicalRecords] = useState<ClinicalRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [patients, setPatients] = useState<UserProfile[]>([]);

  // Monitor Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        try {
          // Attempt to fetch profile
          let profile = await getUserProfile(firebaseUser.uid);
          
          if (!profile) {
            // Retrieve any pending custom registration fields from localStorage
            let pendingName = '';
            let pendingRole: UserRole = 'patient';
            let pendingPhone = '';
            
            try {
              let pendingStr = localStorage.getItem(`pending_profile_${firebaseUser.uid}`);
              if (!pendingStr) {
                pendingStr = localStorage.getItem('pending_magic_profile');
              }
              if (pendingStr) {
                const pending = JSON.parse(pendingStr);
                pendingName = pending.name || '';
                pendingRole = pending.role || 'patient';
                pendingPhone = pending.phone || '';
                
                // Clean up keys
                localStorage.removeItem(`pending_profile_${firebaseUser.uid}`);
                localStorage.removeItem('pending_magic_profile');
              }
            } catch (e) {
              console.error("Error reading pending profile:", e);
            }

            // First time login - Create user profile document in Firestore
            const newProfile: Omit<UserProfile, 'createdAt'> = {
              uid: firebaseUser.uid,
              name: pendingName || firebaseUser.displayName || 'Usuario de Sinergia',
              email: firebaseUser.email || '',
              role: pendingRole, 
              phone: pendingPhone || firebaseUser.phoneNumber || '',
              photoURL: firebaseUser.photoURL || ''
            };
            await createUserProfile(newProfile);
            profile = { ...newProfile, createdAt: new Date().toISOString() };
          }
          
          setCurrentUser(profile);
        } catch (err) {
          console.error("Error setting up user profile in auth change:", err);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time observers when logged-in user changes role or identity
  useEffect(() => {
    if (!currentUser) {
      setAppointments([]);
      setClinicalRecords([]);
      setMessages([]);
      setPatients([]);
      return;
    }

    const isTherapistOrAdmin = currentUser.role === 'therapist' || currentUser.role === 'admin';

    // 1. Appointments Real-Time Observer
    let appointmentsQuery;
    if (isTherapistOrAdmin) {
      appointmentsQuery = query(collection(db, 'appointments'));
    } else {
      appointmentsQuery = query(collection(db, 'appointments'), where('patientId', '==', currentUser.uid));
    }

    const unsubAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as Appointment);
      });
      // Sort appointments by date & time ascending
      list.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
      setAppointments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'appointments');
    });

    // 2. Clinical Records Real-Time Observer
    let recordsQuery;
    if (isTherapistOrAdmin) {
      recordsQuery = query(collection(db, 'clinicalRecords'));
    } else {
      recordsQuery = query(collection(db, 'clinicalRecords'), where('patientId', '==', currentUser.uid));
    }

    const unsubRecords = onSnapshot(recordsQuery, (snapshot) => {
      const list: ClinicalRecord[] = [];
      snapshot.forEach(doc => {
        list.push(doc.data() as ClinicalRecord);
      });
      // Sort newest clinical record first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClinicalRecords(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clinicalRecords');
    });

    // 3. Real-time Messages Observers (Two queries combined to satisfy secure list rules)
    const qSent = query(collection(db, 'messages'), where('senderId', '==', currentUser.uid));
    const qRecv = query(collection(db, 'messages'), where('receiverId', '==', currentUser.uid));

    const mergeAndSortMessages = (sentList: Message[], recvList: Message[]) => {
      const mergedMap = new Map<string, Message>();
      sentList.forEach(m => mergedMap.set(m.id, m));
      recvList.forEach(m => mergedMap.set(m.id, m));
      const list = Array.from(mergedMap.values());
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(list);
    };

    let localSent: Message[] = [];
    let localRecv: Message[] = [];

    const unsubSent = onSnapshot(qSent, (snapshot) => {
      localSent = [];
      snapshot.forEach(doc => {
        localSent.push(doc.data() as Message);
      });
      mergeAndSortMessages(localSent, localRecv);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages_sent');
    });

    const unsubRecv = onSnapshot(qRecv, (snapshot) => {
      localRecv = [];
      snapshot.forEach(doc => {
        localRecv.push(doc.data() as Message);
      });
      mergeAndSortMessages(localSent, localRecv);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages_recv');
    });

    // 4. Patients list for Therapists directory
    let unsubPatients = () => {};
    if (isTherapistOrAdmin) {
      const qPatients = query(collection(db, 'users'), where('role', '==', 'patient'));
      unsubPatients = onSnapshot(qPatients, (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach(doc => {
          list.push(doc.data() as UserProfile);
        });
        setPatients(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users_patients');
      });
    }

    return () => {
      unsubAppointments();
      unsubRecords();
      unsubSent();
      unsubRecv();
      unsubPatients();
    };
  }, [currentUser]);

  // Handle Testing/Demo Role Switch
  const handleToggleRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { role: newRole });
      setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
    } catch (err) {
      console.error("Error switching test roles in database:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center space-y-4" id="app-loader">
        <div className="w-12 h-12 border-4 border-olive-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-sm font-semibold text-olive-800">Iniciando Clínica Sinergia...</p>
          <p className="text-xs text-sage-500 mt-1">Conectando con base de datos en tiempo real</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LandingPage 
          onSignInSuccess={() => {}} 
          loading={false} 
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
        />
        <FloatingAIAssistant />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col justify-between" id="app-workspace">
      {/* Workspace Header */}
      <header className="bg-natural-card border-b border-sage-200/50 sticky top-0 z-50 shadow-sm shadow-sage-100/20" id="workspace-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-olive-500 flex items-center justify-center text-white shadow-md shadow-olive-100/30">
              <Heart className="w-5 h-5 fill-white animate-pulse" />
            </div>
            <div>
              <span className="font-serif italic font-bold text-lg text-olive-700 tracking-tight">Clínica Sinergia</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-olive-600 font-bold tracking-wide uppercase">Tiempo Real Activo</span>
                <span className="w-1.5 h-1.5 bg-olive-500 rounded-full animate-ping"></span>
              </div>
            </div>
          </div>

          {/* User Profile Info & Sign Out */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-sage-50/70 p-1.5 pr-4 rounded-xl border border-sage-200/40">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.name} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover" 
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-sage-100 text-olive-800 flex items-center justify-center font-bold text-sm">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div>
                <span className="font-bold text-xs text-ink-700 block truncate max-w-[120px] leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-sage-600 block">
                  {currentUser.role === 'patient' ? '👤 Paciente' : currentUser.role === 'therapist' ? '🩺 Terapeuta' : '🛡️ Administrador'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-sage-500 hover:text-olive-800 hover:bg-olive-50/50 p-2.5 rounded-xl border border-transparent hover:border-sage-200/50 transition cursor-pointer"
              title={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
              id="btn-theme-toggle"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleSignOut}
              className="text-sage-500 hover:text-olive-800 hover:bg-olive-50/50 p-2.5 rounded-xl border border-transparent hover:border-sage-200/50 transition"
              title="Cerrar sesión"
              id="btn-signout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8" id="workspace-main">
        
        {/* Dynamic Sandbox Selector Drawer/Controls */}
        <div className="bg-gradient-to-r from-olive-600 to-sage-600 rounded-2xl p-4 text-white shadow-md border border-olive-700/20 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4" id="sandbox-roles-box">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sand-200" />
              <h3 className="font-serif italic font-semibold text-xs uppercase tracking-wider">Caja de Pruebas de Roles Clínicos (Sandbox)</h3>
            </div>
            <p className="text-[11px] text-sage-100 leading-relaxed max-w-2xl font-sans">
              ¡Prueba la app en tiempo real! Haz clic en los botones para alternar tu rol al instante. Te sugerimos abrir una pestaña en incógnito o segundo navegador con esta misma URL para probar el chat o las citas en tiempo real simultáneamente.
            </p>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => handleToggleRole('patient')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition duration-150 border ${
                currentUser.role === 'patient'
                  ? 'bg-natural-card text-olive-800 border-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border-transparent'
              }`}
            >
              👤 Ver como Paciente
            </button>
            <button
              onClick={() => handleToggleRole('therapist')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition duration-150 border ${
                currentUser.role === 'therapist'
                  ? 'bg-natural-card text-olive-800 border-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border-transparent'
              }`}
            >
              🩺 Ver como Terapeuta
            </button>
            <button
              onClick={() => handleToggleRole('admin')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition duration-150 border ${
                currentUser.role === 'admin'
                  ? 'bg-natural-card text-olive-800 border-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border-transparent'
              }`}
            >
              🛡️ Ver como Admin
            </button>
          </div>
        </div>

        {/* Workspace centered card */}
        <div className="bg-natural-card rounded-3xl border border-sage-200/50 shadow-lg shadow-sage-200/10 overflow-hidden" id="workspace-card">
          {/* Tab Navigation header */}
          <div className="bg-natural-bg/50 border-b border-sage-200/50 flex items-center overflow-x-auto" id="workspace-tabs-bar">
            {[
              { id: 'appointments', label: 'Mis Citas', icon: Calendar },
              { id: 'records', label: 'Expedientes Clínicos', icon: FileText },
              { id: 'messaging', label: 'Chat Directo', icon: MessageSquare },
              { id: 'guide', label: 'Manual de Terapias', icon: BookOpen },
              { id: 'ai-assistant', label: 'Asistente IA FAQ', icon: Sparkles },
              { id: 'location', label: 'Dónde Estamos', icon: MapPin }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              // Custom count badges
              let badgeCount = 0;
              if (tab.id === 'appointments') badgeCount = appointments.filter(a => a.status === 'pending').length;
              if (tab.id === 'records') badgeCount = clinicalRecords.length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4.5 font-semibold text-xs border-b-2 transition duration-150 shrink-0 ${
                    isActive 
                      ? 'border-olive-500 text-olive-800 bg-natural-card' 
                      : 'border-transparent text-sage-600 hover:text-olive-700 hover:bg-olive-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-olive-600' : 'text-sage-400'}`} />
                  <span className="font-sans">{tab.label}</span>
                  {badgeCount > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-olive-500 text-white' : 'bg-sage-100 text-sage-700'
                    }`}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Content Frame */}
          <div className="p-6 sm:p-8" id="tab-content-frame">
            {activeTab === 'appointments' && (
              <AppointmentsPanel 
                currentUser={currentUser} 
                appointments={appointments} 
                patients={patients} 
              />
            )}

            {activeTab === 'records' && (
              <ClinicalRecordsPanel 
                currentUser={currentUser} 
                records={clinicalRecords} 
                patients={patients} 
              />
            )}

            {activeTab === 'messaging' && (
              <MessagingPanel 
                currentUser={currentUser} 
                messages={messages} 
                patients={patients} 
              />
            )}

            {activeTab === 'guide' && (
              <TherapyGuide />
            )}

            {activeTab === 'ai-assistant' && (
              <AIAssistantPanel />
            )}

            {activeTab === 'location' && (
              <LocationPanel />
            )}
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="bg-natural-card border-t border-sage-200/50 py-6" id="workspace-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sage-500">
            &copy; {new Date().getFullYear()} Clínica Sinergia. Conexión de seguridad activa con Google Firebase.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-olive-700 font-semibold bg-olive-50 border border-olive-200/40 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-olive-600" />
            <span>Encriptación y Autenticación Activas</span>
          </div>
        </div>
      </footer>
      <FloatingAIAssistant />
    </div>
  );
}
