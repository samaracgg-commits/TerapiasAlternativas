import React, { useState } from 'react';
import { Appointment, AppointmentStatus, UserProfile, THERAPY_TYPES, THERAPISTS } from '../types';
import { createAppointment, updateAppointmentStatus, createClinicalRecord } from '../lib/db';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Plus, 
  ChevronRight, 
  Clipboard, 
  User, 
  FileText,
  Activity,
  AlertCircle
} from 'lucide-react';

interface AppointmentsPanelProps {
  currentUser: UserProfile;
  appointments: Appointment[];
  patients: UserProfile[];
}

export const AppointmentsPanel: React.FC<AppointmentsPanelProps> = ({ currentUser, appointments, patients }) => {
  const isTherapistOrAdmin = currentUser.role === 'therapist' || currentUser.role === 'admin';
  
  // State for Patient Scheduling Form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [therapyType, setTherapyType] = useState(THERAPY_TYPES[0]);
  const [selectedTherapistId, setSelectedTherapistId] = useState(THERAPISTS[0].uid);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [patientNotes, setPatientNotes] = useState('');
  const [schedulingError, setSchedulingError] = useState('');
  
  // State for Therapist Evolution Note Modal
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);
  const [objective, setObjective] = useState('');
  const [evolution, setEvolution] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [noteError, setNoteError] = useState('');

  // Filtering appointments
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const filteredAppointments = appointments.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulingError('');
    
    if (!appointmentDate) {
      setSchedulingError('Por favor selecciona una fecha válida.');
      return;
    }

    const therapist = THERAPISTS.find(t => t.uid === selectedTherapistId);
    if (!therapist) return;

    const newApp: Omit<Appointment, 'createdAt' | 'updatedAt'> = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      patientId: currentUser.uid,
      patientName: currentUser.name,
      therapistId: therapist.uid,
      therapistName: therapist.name,
      date: appointmentDate,
      time: appointmentTime,
      therapyType,
      status: 'pending',
      notes: patientNotes
    };

    try {
      await createAppointment(newApp);
      // Reset form
      setShowScheduleForm(false);
      setAppointmentDate('');
      setPatientNotes('');
    } catch (err: any) {
      setSchedulingError('Error al agendar la cita. Inténtalo de nuevo.');
    }
  };

  const handleUpdateStatus = async (appId: string, status: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(appId, status);
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  const handleCompleteSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError('');

    if (!completingAppointment) return;
    if (!objective || !evolution || !recommendations) {
      setNoteError('Todos los campos de la nota de evolución son obligatorios.');
      return;
    }

    try {
      const recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // 1. Create clinical note
      await createClinicalRecord({
        id: recordId,
        patientId: completingAppointment.patientId,
        therapistId: currentUser.uid,
        therapistName: currentUser.name,
        date: completingAppointment.date,
        therapyType: completingAppointment.therapyType,
        objective,
        evolution,
        recommendations
      });

      // 2. Complete appointment
      await updateAppointmentStatus(completingAppointment.id, 'completed');
      
      // Reset evolution note state
      setCompletingAppointment(null);
      setObjective('');
      setEvolution('');
      setRecommendations('');
    } catch (err) {
      setNoteError('Error al guardar la nota y completar la cita.');
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sand-100 text-sand-800 border border-sand-300">Pendiente</span>;
      case 'confirmed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-olive-100 text-olive-800 border border-olive-200">Confirmada</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sage-100 text-sage-800 border border-sage-200">Completada</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-ink-100 text-ink-700 border border-ink-200">Cancelada</span>;
    }
  };

  return (
    <div className="space-y-6" id="appointments-panel">
      {/* Upper header section with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage-100 pb-5">
        <div>
          <h2 className="text-xl font-bold font-serif text-olive-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-olive-600" />
            <span>{isTherapistOrAdmin ? 'Agenda de la Clínica' : 'Mis Citas Terapéuticas'}</span>
          </h2>
          <p className="text-xs text-sage-600 mt-1">
            {isTherapistOrAdmin 
              ? 'Revisa y gestiona los turnos de terapias asignados a la clínica en tiempo real.' 
              : 'Agenda tus sesiones de terapia y revisa su estado actual.'}
          </p>
        </div>

        {!isTherapistOrAdmin && (
          <button
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="inline-flex items-center gap-2 bg-olive-600 hover:bg-olive-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition duration-150 self-start sm:self-auto"
            id="btn-schedule-new"
          >
            {showScheduleForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showScheduleForm ? 'Cerrar Formulario' : 'Agendar Nueva Cita'}</span>
          </button>
        )}
      </div>

      {/* Patient Booking Form */}
      {showScheduleForm && !isTherapistOrAdmin && (
        <div className="bg-natural-card border border-sage-200/50 rounded-2xl p-6 shadow-sm max-w-2xl" id="booking-form-container">
          <h3 className="font-serif italic font-bold text-olive-800 text-sm mb-4">Formulario de Solicitud de Cita</h3>
          
          {schedulingError && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{schedulingError}</span>
            </div>
          )}

          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-sage-700 mb-1">Tipo de Terapia</label>
                <select
                  value={therapyType}
                  onChange={(e) => setTherapyType(e.target.value)}
                  className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
                >
                  {THERAPY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-sage-700 mb-1">Especialista / Terapeuta</label>
                <select
                  value={selectedTherapistId}
                  onChange={(e) => setSelectedTherapistId(e.target.value)}
                  className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
                >
                  {THERAPISTS.map(t => (
                    <option key={t.uid} value={t.uid}>{t.name} ({t.specialty})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-sage-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={appointmentDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sage-700 mb-1">Hora de Preferencia</label>
                <select
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
                >
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-700 mb-1">Notas de evolución o motivos de consulta (Opcional)</label>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                rows={3}
                placeholder="Por favor describe brevemente si tienes síntomas, derivación médica o algún detalle para el terapeuta..."
                className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="bg-sage-100 text-sage-700 text-xs font-bold py-2 px-4 rounded-lg hover:bg-sage-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-olive-600 hover:bg-olive-700 text-white text-xs font-bold py-2 px-4 rounded-lg hover:shadow-md transition"
              >
                Enviar Solicitud
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evolution Note Creation Form (Inline modal when therapist clicks 'Complete Session') */}
      {completingAppointment && (
        <div className="bg-natural-card border-2 border-olive-500 rounded-2xl p-6 shadow-md max-w-2xl" id="evolution-note-form">
          <div className="flex items-center gap-2 mb-3 text-olive-800">
            <FileText className="w-5 h-5 text-olive-600" />
            <h3 className="font-serif italic font-bold text-sm">Registrar Nota de Evolución Clínica</h3>
          </div>
          <p className="text-xs text-sage-600 mb-4 font-sans">
            Al registrar la evolución del paciente <strong>{completingAppointment.patientName}</strong>, la sesión de <strong>{completingAppointment.therapyType}</strong> se guardará en su expediente clínico y marcará la cita como completada.
          </p>

          {noteError && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{noteError}</span>
            </div>
          )}

          <form onSubmit={handleCompleteSession} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-sage-700 mb-1">Objetivo General de la Sesión</label>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ej. Incrementar amplitud articular en miembro superior izquierdo..."
                className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-700 mb-1">Desarrollo y Evolución del Paciente</label>
              <textarea
                value={evolution}
                onChange={(e) => setEvolution(e.target.value)}
                rows={3}
                placeholder="Ej. El paciente se muestra colaborador durante los ejercicios propioceptivos. Mantiene el equilibrio monopodal durante 10 segundos, mejorando un 20% respecto a la sesión anterior..."
                className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-700 mb-1">Recomendaciones y Plan para el Hogar</label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={2}
                placeholder="Ej. Realizar estiramientos del flexor de cadera 3 veces al día. Evitar sobreesfuerzos y aplicar hielo localizado si se presenta molestia leve..."
                className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCompletingAppointment(null)}
                className="bg-sage-100 text-sage-700 text-xs font-bold py-2 px-4 rounded-lg hover:bg-sage-200 transition"
              >
                Regresar
              </button>
              <button
                type="submit"
                className="bg-olive-600 hover:bg-olive-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg hover:shadow-md transition"
              >
                Guardar Nota y Completar Cita
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointment Filtering Controls */}
      <div className="flex gap-2 items-center overflow-x-auto pb-1" id="appointment-filters">
        <span className="text-xs font-bold text-sage-500 mr-2 shrink-0">Filtrar por:</span>
        {[
          { label: 'Todos', val: 'all' },
          { label: 'Pendientes', val: 'pending' },
          { label: 'Confirmadas', val: 'confirmed' },
          { label: 'Completadas', val: 'completed' },
          { label: 'Canceladas', val: 'cancelled' }
        ].map(btn => (
          <button
            key={btn.val}
            onClick={() => setStatusFilter(btn.val)}
            className={`text-xs px-3.5 py-1.5 rounded-lg border font-bold shrink-0 transition duration-150 ${
              statusFilter === btn.val
                ? 'bg-olive-600 text-white border-olive-600'
                : 'bg-natural-card hover:bg-olive-50/50 text-sage-700 border-sage-200/50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Appointments List Render */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-natural-card border border-sage-200/50 rounded-2xl p-10 text-center space-y-3" id="no-appointments">
          <div className="w-12 h-12 bg-natural-bg rounded-full flex items-center justify-center text-sage-400 mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-olive-800 text-sm">No hay citas registradas</h3>
          <p className="text-xs text-sage-600 max-w-sm mx-auto">
            {isTherapistOrAdmin 
              ? 'No hay citas registradas en la clínica con el filtro seleccionado.' 
              : 'Agenda tu primera sesión pulsando el botón de "Agendar Nueva Cita" superior.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="appointments-grid">
          {filteredAppointments.map(app => (
            <div 
              key={app.id} 
              className={`bg-natural-card rounded-2xl border p-5 space-y-4 shadow-sm transition hover:shadow-md ${
                app.status === 'pending' ? 'border-sand-300 hover:border-sand-400 bg-sand-50/10' :
                app.status === 'confirmed' ? 'border-olive-200 hover:border-olive-300 bg-olive-50/10' :
                app.status === 'completed' ? 'border-sage-200 hover:border-sage-300 bg-sage-50/10' :
                'border-sage-200/30 opacity-75'
              }`}
            >
              {/* Card Header: Therapy Type + Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-serif italic font-bold text-olive-800 text-sm">{app.therapyType}</h4>
                  <p className="text-[10px] text-sage-500 font-mono">ID: {app.id.substring(0, 10)}...</p>
                </div>
                {getStatusBadge(app.status)}
              </div>

              {/* Patient/Therapist Details */}
              <div className="grid grid-cols-2 gap-3 bg-natural-bg border border-sage-200/30 p-3.5 rounded-xl text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-sage-500 font-bold block">Paciente</span>
                  <div className="flex items-center gap-1.5 text-ink-700 font-semibold">
                    <User className="w-3.5 h-3.5 text-sage-400 shrink-0" />
                    <span className="truncate">{app.patientName}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-sage-500 font-bold block">Terapeuta</span>
                  <div className="flex items-center gap-1.5 text-ink-700 font-semibold">
                    <Activity className="w-3.5 h-3.5 text-olive-600 shrink-0" />
                    <span className="truncate">{app.therapistName}</span>
                  </div>
                </div>
              </div>

              {/* Date & Time info */}
              <div className="flex items-center gap-4 text-xs text-sage-700 font-semibold">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sage-400" />
                  <span>{app.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sage-400" />
                  <span>{app.time} HS</span>
                </div>
              </div>

              {app.notes && (
                <div className="text-xs text-sage-700 bg-natural-bg p-2.5 rounded-lg border border-sage-200/20 leading-relaxed italic">
                  &ldquo;{app.notes}&rdquo;
                </div>
              )}

              {/* Action Buttons for Card */}
              <div className="flex gap-2 justify-end pt-1">
                {/* For Patients: Cancel option if pending or confirmed */}
                {!isTherapistOrAdmin && (app.status === 'pending' || app.status === 'confirmed') && (
                  <button
                    onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                    className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 text-xs font-bold py-2 px-3.5 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar Cita</span>
                  </button>
                )}

                {/* For Therapists: Complete, Confirm, Cancel */}
                {isTherapistOrAdmin && app.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                      className="inline-flex items-center gap-1 text-sage-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 text-xs font-bold py-1.5 px-3 rounded-lg transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Rechazar</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                      className="inline-flex items-center gap-1 text-olive-800 bg-olive-100/50 border border-olive-200 hover:bg-olive-100 text-xs font-bold py-1.5 px-3.5 rounded-lg transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmar</span>
                    </button>
                  </>
                )}

                {isTherapistOrAdmin && app.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                      className="inline-flex items-center gap-1 text-sage-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold py-1.5 px-3 rounded-lg transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      onClick={() => setCompletingAppointment(app)}
                      className="inline-flex items-center gap-1.5 text-olive-800 bg-sand-200 border border-sand-300 hover:bg-sand-300 text-xs font-bold py-1.5 px-3.5 rounded-lg transition cursor-pointer"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-olive-700" />
                      <span>Registrar Evolución</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
