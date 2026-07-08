import React, { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendSignInLinkToEmail
} from 'firebase/auth';
import { auth, firebaseConfig, saveCustomFirebaseConfig, clearCustomFirebaseConfig } from '../firebase';
import { createUserProfile } from '../lib/db';
import { THERAPY_TYPES } from '../types';
import { 
  Activity, 
  ShieldCheck, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  ArrowRight,
  Heart,
  Sun,
  Moon,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRightLeft,
  MapPin,
  Settings
} from 'lucide-react';

interface LandingPageProps {
  onSignInSuccess: () => void;
  loading: boolean;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onSignInSuccess, 
  loading,
  darkMode,
  onToggleTheme
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'patient' | 'therapist'>('patient');
  const [emailMethod, setEmailMethod] = useState<'password' | 'magic-link'>('password');
  const [localLoading, setLocalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // States for advanced Firebase project configurations (such as bdclinica-nuevo)
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [pasteJson, setPasteJson] = useState('');
  const [customApiKey, setCustomApiKey] = useState(firebaseConfig.apiKey || '');
  const [customAppId, setCustomAppId] = useState(firebaseConfig.appId || '');
  const [customMessagingSenderId, setCustomMessagingSenderId] = useState(firebaseConfig.messagingSenderId || '');
  const [customAuthDomain, setCustomAuthDomain] = useState(firebaseConfig.authDomain || 'bdclinica-nuevo.firebaseapp.com');
  const [customProjectId, setCustomProjectId] = useState(firebaseConfig.projectId || 'bdclinica-nuevo');
  const [customStorageBucket, setCustomStorageBucket] = useState(firebaseConfig.storageBucket || 'bdclinica-nuevo.firebasestorage.app');
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handlePasteConfigJson = (jsonStr: string) => {
    setPasteJson(jsonStr);
    try {
      let parsed: any = null;
      if (jsonStr.trim().startsWith('{')) {
        parsed = JSON.parse(jsonStr.trim());
      } else {
        const extract = (key: string) => {
          const match = jsonStr.match(new RegExp(`${key}\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i'));
          return match ? match[1] : '';
        };
        parsed = {
          apiKey: extract('apiKey'),
          authDomain: extract('authDomain'),
          projectId: extract('projectId'),
          storageBucket: extract('storageBucket'),
          messagingSenderId: extract('messagingSenderId'),
          appId: extract('appId'),
          measurementId: extract('measurementId')
        };
      }

      if (parsed && parsed.apiKey && parsed.projectId) {
        setCustomApiKey(parsed.apiKey);
        setCustomAppId(parsed.appId || '');
        setCustomMessagingSenderId(parsed.messagingSenderId || '');
        if (parsed.authDomain) setCustomAuthDomain(parsed.authDomain);
        if (parsed.projectId) setCustomProjectId(parsed.projectId);
        if (parsed.storageBucket) setCustomStorageBucket(parsed.storageBucket);
        setErrorMessage('');
      }
    } catch (err) {
      console.warn('Error trying to parse pasted JSON config:', err);
    }
  };

  const handleSaveConfig = () => {
    if (!customApiKey || !customProjectId) {
      setErrorMessage('La Clave de API (API Key) y el ID del Proyecto son obligatorios.');
      return;
    }
    
    // Auto-sanitize project ID just in case the user types the extra 's' or older project name
    let sanitizedProjectId = customProjectId.trim();
    if (sanitizedProjectId.includes('clinicasterapias') || sanitizedProjectId.includes('clinicaterapias')) {
      sanitizedProjectId = 'bdclinica-nuevo';
    }
    
    let sanitizedAuthDomain = customAuthDomain.trim() || `${sanitizedProjectId}.firebaseapp.com`;
    if (sanitizedAuthDomain.includes('clinicasterapias') || sanitizedAuthDomain.includes('clinicaterapias')) {
      sanitizedAuthDomain = 'bdclinica-nuevo.firebaseapp.com';
    }

    let sanitizedStorageBucket = customStorageBucket.trim() || `${sanitizedProjectId}.firebasestorage.app`;
    if (sanitizedStorageBucket.includes('clinicasterapias') || sanitizedStorageBucket.includes('clinicaterapias')) {
      sanitizedStorageBucket = 'bdclinica-nuevo.firebasestorage.app';
    }

    const newConfig = {
      apiKey: customApiKey.trim(),
      authDomain: sanitizedAuthDomain,
      projectId: sanitizedProjectId,
      storageBucket: sanitizedStorageBucket,
      messagingSenderId: customMessagingSenderId.trim(),
      appId: customAppId.trim(),
      firestoreDatabaseId: '(default)'
    };
    saveCustomFirebaseConfig(newConfig);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLocalLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSignInSuccess();
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      let friendlyMsg = err.message || String(err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        friendlyMsg = `⚠️ Dominio no autorizado en tu Firebase. Debes añadir "${window.location.hostname}" a los Dominios Autorizados en la consola de tu Firebase (Authentication > Settings > Authorized domains).`;
      } else if (err.code === 'auth/api-key-not-valid' || err.message?.includes('invalid-api-key') || err.message?.includes('API key')) {
        friendlyMsg = '⚠️ Clave de API (API Key) incorrecta. Asegúrate de configurar las credenciales correctas de tu proyecto "bdclinica-nuevo" en el panel inferior.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMsg = '⚠️ El inicio de sesión con Google no está habilitado en tu proyecto Firebase. Habilítalo en Authentication > Sign-in method.';
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        friendlyMsg = '⚠️ Error de configuración. Por favor verifica que tu API Key sea correcta para el proyecto "bdclinica-nuevo".';
      }
      setErrorMessage(friendlyMsg);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLocalLoading(true);

    try {
      if (emailMethod === 'magic-link') {
        if (!email.trim()) {
          throw new Error('Por favor, ingresa tu correo electrónico.');
        }

        const actionCodeSettings = {
          url: window.location.origin + window.location.pathname,
          handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email.trim());

        if (authMode === 'register') {
          const pendingProfile = {
            name: fullName.trim() || 'Usuario de Sinergia',
            email: email.trim(),
            role: role,
            phone: phone.trim()
          };
          window.localStorage.setItem('pending_magic_profile', JSON.stringify(pendingProfile));
        }

        setSuccessMessage('📧 ¡Enlace enviado! Revisa tu bandeja de entrada de correo electrónico y haz clic en el enlace para iniciar sesión sin contraseña.');
        return;
      }

      if (authMode === 'login') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Por favor, ingresa correo y contraseña.');
        }
        await signInWithEmailAndPassword(auth, email.trim(), password.trim());
        onSignInSuccess();
      } else {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
          throw new Error('Por favor, completa los campos requeridos (Nombre, Correo y Contraseña).');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        // Store the registration metadata in localStorage so App.tsx can fallback-load it
        // and avoid race conditions with onAuthStateChanged
        const pendingProfile = {
          name: fullName.trim(),
          email: email.trim(),
          role: role,
          phone: phone.trim()
        };
        
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        const firebaseUser = userCredential.user;

        localStorage.setItem(`pending_profile_${firebaseUser.uid}`, JSON.stringify(pendingProfile));

        // Set display name
        await updateProfile(firebaseUser, { displayName: fullName.trim() });

        // Attempt direct firestore profile creation
        try {
          await createUserProfile({
            uid: firebaseUser.uid,
            name: fullName.trim(),
            email: email.trim(),
            role: role,
            phone: phone.trim(),
            photoURL: ''
          });
        } catch (dbErr) {
          console.warn("Direct profile creation failed, falling back to app-level handler:", dbErr);
        }

        setSuccessMessage('¡Cuenta creada exitosamente!');
        onSignInSuccess();
      }
    } catch (err: any) {
      console.error('Error with email authentication:', err);
      let friendlyMessage = err.message;
      
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('configuration-not-found')) {
        friendlyMessage = 'El inicio de sesión con correo o enlace mágico no está habilitado en tu Firebase. Actívalos en la Consola de Firebase > Authentication > Sign-in method.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'El formato del correo electrónico no es válido.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Credenciales incorrectas o usuario no encontrado. Verifica tu información.';
      }
      
      setErrorMessage(friendlyMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col justify-between" id="landing-container">
      {/* Hero Section */}
      <header className="bg-natural-card border-b border-sage-200/50" id="landing-header">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2" id="landing-logo">
            <div className="w-10 h-10 rounded-xl bg-olive-500 flex items-center justify-center text-white shadow-md shadow-olive-100/30">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-serif italic font-bold text-lg text-olive-700 tracking-tight">Clínica Sinergia</span>
              <span className="block text-[10px] text-sage-600 font-bold tracking-wide uppercase">Centro Terapéutico</span>
            </div>
          </div>
          <div className="flex items-center gap-4" id="system-status">
            <button
              onClick={onToggleTheme}
              className="text-sage-500 hover:text-olive-800 hover:bg-olive-50/50 p-2.5 rounded-xl border border-transparent hover:border-sage-200/50 transition cursor-pointer"
              title={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
              id="landing-theme-toggle"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start" id="landing-main">
        {/* Left column: Text & Info */}
        <div className="lg:col-span-7 space-y-8" id="landing-intro">
          <div className="inline-flex items-center gap-2 bg-olive-50 text-olive-700 px-3 py-1 rounded-full text-xs font-semibold border border-olive-200/40">
            <Sparkles className="w-3.5 h-3.5 text-olive-600" />
            <span>Plataforma Integradora en Tiempo Real</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-serif font-extrabold text-olive-900 tracking-tight leading-tight" id="landing-title">
            Gestión inteligente de terapias, <span className="italic text-olive-600">en un solo lugar.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-sage-800 max-w-xl leading-relaxed font-sans" id="landing-description">
            Bienvenido a Clínica Sinergia. Nuestra plataforma facilita la programación de citas, el seguimiento clínico detallado y la comunicación directa entre pacientes y terapeutas.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4" id="landing-features">
            <div className="bg-natural-card p-5 rounded-2xl border border-sage-200/40 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-sand-100 flex items-center justify-center text-sand-700">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-serif italic font-bold text-olive-800 text-sm">Agenda Real-Time</h3>
              <p className="text-xs text-sage-600">Programa, confirma y cancela citas instantáneamente.</p>
            </div>

            <div className="bg-natural-card p-5 rounded-2xl border border-sage-200/40 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-sage-100 flex items-center justify-center text-sage-700">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-serif italic font-bold text-olive-800 text-sm">Notas de Evolución</h3>
              <p className="text-xs text-sage-600">Historial de progreso y metas terapéuticas estructuradas.</p>
            </div>

            <div className="bg-natural-card p-5 rounded-2xl border border-sage-200/40 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-olive-100 flex items-center justify-center text-olive-700">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-serif italic font-bold text-olive-800 text-sm">Chat Profesional</h3>
              <p className="text-xs text-sage-600">Comunicación sincrónica segura con tu especialista.</p>
            </div>
          </div>

          {/* Dónde Estamos / Dirección Info card for public/prospective users */}
          <div className="bg-olive-50/65 dark:bg-olive-950/20 border border-olive-200/40 dark:border-olive-800/40 p-5 rounded-3xl space-y-3.5 shadow-sm" id="landing-location-card">
            <div className="flex items-center gap-2 text-olive-800 dark:text-olive-300">
              <MapPin className="w-4 h-4 text-olive-600 dark:text-olive-400 shrink-0 animate-bounce" />
              <h3 className="font-serif italic font-bold text-xs uppercase tracking-wider">Dónde Estamos / Dirección</h3>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-sage-900 dark:text-sage-200 font-semibold leading-relaxed">
                📍 <strong>Dirección:</strong> Calle de Serrano, 45, Distrito de Salamanca, 28001 Madrid, España.
              </p>
              <p className="text-[11px] text-sage-700 dark:text-sage-300 leading-relaxed">
                🚇 <strong>Metro cercano:</strong> Serrano (Línea 4 - 2 min), Núñez de Balboa (Líneas 5 y 9 - 5 min).
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-sage-500 dark:text-sage-400 border-t border-sage-200/30 dark:border-sage-800/30 pt-2 font-medium">
              <span>🕒 L-V 08:00 - 21:00 / S 09:00 - 14:00</span>
              <span>📞 +34 912 345 678</span>
            </div>
          </div>
        </div>

        {/* Right column: Visual Therapy Photo + Compact User Access Box */}
        <div className="lg:col-span-5 space-y-5" id="landing-visual-column">
          {/* Realistic Photography Evoking Natural Therapies */}
          <div className="relative rounded-3xl overflow-hidden shadow-sm border border-sage-200/40 bg-natural-card group h-[220px] sm:h-[240px]">
            <img 
              src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=800" 
              alt="Terapias Naturales y Bienestar" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 bg-olive-500 rounded-full"></span>
                <p className="text-[9px] uppercase font-bold tracking-wider text-olive-800 dark:text-olive-400 font-mono">Espacio de Salud Natural</p>
              </div>
              <p className="font-serif italic text-[11px] text-sage-800 dark:text-sage-200 leading-normal">
                Restauramos tu equilibrio físico y emocional con terapias naturales y cuidado holístico.
              </p>
            </div>
          </div>

          {/* Redesigned Compact Login/Register Card (Less Prominent) */}
          <div className="bg-natural-card rounded-3xl border border-sage-200/50 shadow-sm p-5 space-y-4" id="landing-login-card">
            
            {/* Segmented Auth Selector */}
            <div className="flex bg-natural-bg p-1 rounded-xl border border-sage-200/40" id="auth-selector">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-olive-600 text-white shadow-sm'
                    : 'text-sage-600 hover:text-olive-800'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-olive-600 text-white shadow-sm'
                    : 'text-sage-600 hover:text-olive-800'
                }`}
              >
                Registrarse
              </button>
            </div>

            <div className="space-y-0.5 text-center">
              <h2 className="text-sm font-serif italic font-bold text-olive-900">
                {authMode === 'login' ? 'Acceso de Usuarios' : 'Crea tu Cuenta'}
              </h2>
              <p className="text-[10px] text-sage-600">
                {authMode === 'login' 
                  ? 'Introduce tus credenciales para acceder' 
                  : 'Regístrate para programar citas y consultas'}
              </p>
            </div>

            {/* Error and Success Banners */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200/60 text-red-800 text-[11px] font-semibold p-3.5 rounded-xl space-y-1 shadow-inner" id="auth-error-banner">
                <p>{errorMessage}</p>
                {authMode === 'register' && (
                  <p className="text-[10px] text-red-600/90 font-normal">
                    💡 Si estás configurando esto por primera vez, asegúrate de activar el proveedor de "Correo electrónico y contraseña" en la consola de Firebase Authentication de tu proyecto.
                  </p>
                )}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200/60 text-green-800 text-[11px] font-semibold p-3.5 rounded-xl shadow-inner" id="auth-success-banner">
                {successMessage}
              </div>
            )}

            {/* Email Method Toggle (Password vs Magic Link) */}
            <div className="flex bg-natural-bg/80 p-1 rounded-xl border border-sage-200/50" id="email-method-selector">
              <button
                type="button"
                onClick={() => {
                  setEmailMethod('password');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  emailMethod === 'password'
                    ? 'bg-olive-600/10 text-olive-800 border border-olive-200/30'
                    : 'text-sage-500 hover:text-olive-700'
                }`}
              >
                Con Contraseña
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailMethod('magic-link');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  emailMethod === 'magic-link'
                    ? 'bg-olive-600/10 text-olive-800 border border-olive-200/30'
                    : 'text-sage-500 hover:text-olive-700'
                }`}
              >
                Enlace Mágico (Sin Contraseña)
              </button>
            </div>

            {/* Email and Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4" id="email-auth-form">
              {authMode === 'register' && (
                <>
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sage-600 uppercase tracking-wide">Nombre Completo *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-sage-400" />
                      <input
                        type="text"
                        required
                        placeholder="Juan Pérez"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-natural-bg border border-sage-200/80 text-xs py-2.5 pl-10 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/10 focus:border-olive-500 text-ink-700 font-medium"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sage-600 uppercase tracking-wide">Teléfono de Contacto</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-sage-400" />
                      <input
                        type="tel"
                        placeholder="+34 600 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-natural-bg border border-sage-200/80 text-xs py-2.5 pl-10 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/10 focus:border-olive-500 text-ink-700 font-medium"
                      />
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sage-600 uppercase tracking-wide">Tipo de Usuario *</label>
                    <div className="relative">
                      <ArrowRightLeft className="absolute left-3 top-3 w-4 h-4 text-sage-400" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'patient' | 'therapist')}
                        className="w-full bg-natural-bg border border-sage-200/80 text-xs py-2.5 pl-10 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/10 focus:border-olive-500 text-ink-700 font-semibold cursor-pointer appearance-none"
                      >
                        <option value="patient">Paciente (Ver mis citas y expedientes)</option>
                        <option value="therapist">Terapeuta / Especialista (Gestionar pacientes)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-sage-600 uppercase tracking-wide">Correo Electrónico *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-sage-400" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-natural-bg border border-sage-200/80 text-xs py-2.5 pl-10 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/10 focus:border-olive-500 text-ink-700 font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              {emailMethod === 'password' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-sage-600 uppercase tracking-wide">Contraseña *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-sage-400" />
                    <input
                      type="password"
                      required={emailMethod === 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-natural-bg border border-sage-200/80 text-xs py-2.5 pl-10 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/10 focus:border-olive-500 text-ink-700 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={localLoading || loading}
                className="w-full flex items-center justify-center gap-2 bg-olive-700 hover:bg-olive-800 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition duration-150 disabled:opacity-50 cursor-pointer"
                id="btn-email-auth-submit"
              >
                {localLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>
                      {emailMethod === 'magic-link'
                        ? 'Enviar Enlace de Acceso'
                        : authMode === 'login'
                          ? 'Iniciar Sesión'
                          : 'Registrar Cuenta'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 text-sage-200 py-1">
              <div className="h-px bg-sage-200/50 flex-grow"></div>
              <span className="text-[9px] font-bold text-sage-400 tracking-wide uppercase">O accede con</span>
              <div className="h-px bg-sage-200/50 flex-grow"></div>
            </div>

            {/* Google Sign-In as fallback */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || localLoading}
              className="w-full flex items-center justify-center gap-3 bg-natural-bg hover:bg-olive-50/30 border border-sage-200/60 hover:border-sage-300 text-ink-700 font-bold py-3 px-4 rounded-xl shadow-sm transition duration-150 disabled:opacity-50 cursor-pointer"
              id="btn-google-login"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ea4335"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#4285f4"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-sans text-xs font-semibold">Ingresar con Google</span>
            </button>

            {/* Extra Clinical notice */}
            <div className="bg-natural-bg rounded-2xl p-4 border border-sage-200/40 flex gap-3 text-sage-700">
              <ShieldCheck className="w-5 h-5 text-olive-600 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-sans">
                Tus datos de salud y consultas están protegidos con reglas de seguridad estrictas en Google Cloud Firestore.
              </p>
            </div>

            {/* Developer Firebase Config Assistant */}
            <div className="border-t border-sage-200/50 pt-4" id="fb-config-assistant">
              <button
                type="button"
                onClick={() => setShowFirebaseConfig(!showFirebaseConfig)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-olive-700 hover:text-olive-900 transition cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Settings className={`w-3.5 h-3.5 ${showFirebaseConfig ? 'animate-spin' : ''}`} />
                  <span>🔧 Configuración Avanzada de Firebase</span>
                </div>
                <span className="text-sage-400">{showFirebaseConfig ? 'Ocultar' : 'Mostrar'}</span>
              </button>

              {showFirebaseConfig && (
                <div className="mt-4 bg-olive-50/50 p-4 rounded-2xl border border-olive-200/30 space-y-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-olive-900">Proyecto de Firebase activo:</p>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-sage-200/40 font-mono text-[10px] break-all space-y-1 text-sage-700 shadow-inner">
                      <div><strong>Project ID:</strong> {firebaseConfig.projectId}</div>
                      <div><strong>API Key:</strong> {firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : '⚠️ No configurado'}</div>
                      <div><strong>App ID:</strong> {firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 15)}...` : '⚠️ No configurado'}</div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-1.5 text-[11px] text-sage-800 leading-relaxed bg-white/60 p-3 rounded-xl border border-sage-200/30">
                    <p className="font-bold text-olive-800">⚠️ Pasos requeridos en tu Consola Firebase para que funcione:</p>
                    <ul className="list-decimal list-inside space-y-1 text-[10px]">
                      <li>Habilita <strong>Google</strong> y <strong>Correo electrónico</strong> en <em>Authentication &gt; Sign-in method</em>.</li>
                      <li>
                        Añade este dominio a tus dominios autorizados:
                        <div className="mt-1 flex items-center justify-between bg-white p-1.5 rounded border border-sage-200 font-mono text-[10px] break-all">
                          <span>{window.location.hostname}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.hostname);
                              setCopiedDomain(true);
                              setTimeout(() => setCopiedDomain(false), 2000);
                            }}
                            className="text-olive-600 hover:text-olive-800 font-sans font-bold text-[9px] cursor-pointer"
                          >
                            {copiedDomain ? '¡Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Paste JSON */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-sage-600 uppercase tracking-wide">
                      Pega tu Firebase Config JSON (desde la Consola de Firebase):
                    </label>
                    <textarea
                      placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  projectId: "bdclinica-nuevo",\n  ...\n};`}
                      value={pasteJson}
                      onChange={(e) => handlePasteConfigJson(e.target.value)}
                      className="w-full bg-white border border-sage-200 text-[10px] p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-olive-500 font-mono h-20 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-sage-500 uppercase">Clave de API *</label>
                      <input
                        type="text"
                        required
                        placeholder="AIzaSy..."
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        className="w-full bg-white border border-sage-200 text-[10px] py-1.5 px-2 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-sage-500 uppercase">Project ID *</label>
                      <input
                        type="text"
                        required
                        value={customProjectId}
                        onChange={(e) => setCustomProjectId(e.target.value)}
                        className="w-full bg-white border border-sage-200 text-[10px] py-1.5 px-2 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-sage-500 uppercase">App ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="1:123456:web:abcd..."
                        value={customAppId}
                        onChange={(e) => setCustomAppId(e.target.value)}
                        className="w-full bg-white border border-sage-200 text-[10px] py-1.5 px-2 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-sage-500 uppercase">Sender ID</label>
                      <input
                        type="text"
                        placeholder="1234567890"
                        value={customMessagingSenderId}
                        onChange={(e) => setCustomMessagingSenderId(e.target.value)}
                        className="w-full bg-white border border-sage-200 text-[10px] py-1.5 px-2 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="flex-1 bg-olive-600 hover:bg-olive-700 text-white font-bold py-2 rounded-lg text-center cursor-pointer text-[11px] transition shadow"
                    >
                      Guardar y Conectar
                    </button>
                    {localStorage.getItem('custom_firebase_config') && (
                      <button
                        type="button"
                        onClick={clearCustomFirebaseConfig}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold py-2 px-3 rounded-lg text-center cursor-pointer text-[11px] transition shadow"
                      >
                        Restablecer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-natural-card border-t border-sage-200/50 py-6" id="landing-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sage-500">
            &copy; {new Date().getFullYear()} Clínica Sinergia. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-xs text-sage-400">
            <span className="hover:text-olive-700 cursor-pointer">Privacidad de Datos</span>
            <span className="hover:text-olive-700 cursor-pointer">Términos de Servicio</span>
            <span className="hover:text-olive-700 cursor-pointer">Reglas de Seguridad</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
