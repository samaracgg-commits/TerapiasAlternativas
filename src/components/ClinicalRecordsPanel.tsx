import React, { useState } from 'react';
import { ClinicalRecord, UserProfile, THERAPY_TYPES } from '../types';
import { createClinicalRecord } from '../lib/db';
import { 
  FileText, 
  Search, 
  Plus, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  UserCheck, 
  BookOpen, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface ClinicalRecordsPanelProps {
  currentUser: UserProfile;
  records: ClinicalRecord[];
  patients: UserProfile[];
}

export const ClinicalRecordsPanel: React.FC<ClinicalRecordsPanelProps> = ({ currentUser, records, patients }) => {
  const isTherapistOrAdmin = currentUser.role === 'therapist' || currentUser.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  
  // State for clinical record creator form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [therapyType, setTherapyType] = useState(THERAPY_TYPES[0]);
  const [objective, setObjective] = useState('');
  const [evolution, setEvolution] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Filtering records based on user role and search term
  const filteredRecords = records.filter(rec => {
    const matchesSearch = 
      rec.therapistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.therapyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.objective.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (isTherapistOrAdmin) {
      // Find patient profile to match name
      const patient = patients.find(p => p.uid === rec.patientId);
      const patientNameMatch = patient ? patient.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      return matchesSearch || patientNameMatch;
    }
    
    return matchesSearch;
  });

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedPatientId) {
      setFormError('Por favor selecciona un paciente válido.');
      return;
    }
    if (!objective || !evolution || !recommendations) {
      setFormError('Todos los campos clínicos son obligatorios.');
      return;
    }

    try {
      const recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await createClinicalRecord({
        id: recordId,
        patientId: selectedPatientId,
        therapistId: currentUser.uid,
        therapistName: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        therapyType,
        objective,
        evolution,
        recommendations
      });

      setFormSuccess('¡Nota clínica guardada con éxito en el expediente del paciente!');
      setObjective('');
      setEvolution('');
      setRecommendations('');
      setTimeout(() => {
        setShowCreateForm(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError('Error al guardar la nota clínica.');
    }
  };

  const toggleExpandRecord = (id: string) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  return (
    <div className="space-y-6" id="clinical-records-panel">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage-100 pb-5">
        <div>
          <h2 className="text-xl font-bold font-serif text-olive-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-olive-600" />
            <span>Expedientes y Notas Clínicas</span>
          </h2>
          <p className="text-xs text-sage-600 mt-1">
            {isTherapistOrAdmin 
              ? 'Registra evoluciones y revisa el historial clínico unificado de todos los pacientes.' 
              : 'Historial clínico de tus evoluciones, objetivos y recomendaciones terapéuticas en el hogar.'}
          </p>
        </div>

        {isTherapistOrAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 bg-olive-600 hover:bg-olive-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition duration-150 self-start sm:self-auto"
            id="btn-create-clinical-note"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4.5 h-4.5" />}
            <span>{showCreateForm ? 'Cerrar Formulario' : 'Crear Nota Clínica'}</span>
          </button>
        )}
      </div>

      {/* Manual Clinical Note Creator Form */}
      {showCreateForm && isTherapistOrAdmin && (
        <div className="bg-natural-card border border-sage-200/50 rounded-2xl p-6 shadow-sm max-w-2xl" id="manual-record-form">
          <h3 className="font-serif italic font-bold text-olive-800 text-sm mb-4">Nueva Ficha de Evolución Clínica</h3>
          
          {formError && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 bg-olive-50 border border-olive-200 text-olive-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateRecord} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-sage-700 mb-1">Paciente</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
                >
                  <option value="">-- Selecciona un paciente --</option>
                  {patients.map(p => (
                    <option key={p.uid} value={p.uid}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-sage-700 mb-1">Especialidad de Terapia</label>
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
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-700 mb-1">Objetivo de la Sesión</label>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ej. Facilitación propioceptiva para fortalecimiento de tobillos..."
                className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-700 mb-1">Evolución y Desempeño Clínico</label>
              <textarea
                value={evolution}
                onChange={(e) => setEvolution(e.target.value)}
                rows={3}
                placeholder="Ej. El paciente completó el circuito motriz con asistencia mínima. Muestra mayor tolerancia al estímulo vestibular..."
                className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sage-700 mb-1">Indicaciones y Tareas para el Hogar</label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={2}
                placeholder="Ej. Realizar masajes estimulantes en planta de pies antes de dormir, calzado descalzo en superficies irregulares..."
                className="w-full bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2 px-3 rounded-lg focus:outline-olive-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-sage-100 text-sage-700 text-xs font-bold py-2 px-4 rounded-lg hover:bg-sage-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-olive-600 hover:bg-olive-700 text-white text-xs font-bold py-2 px-4 rounded-lg hover:shadow-md transition"
              >
                Guardar Ficha
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative" id="records-search-bar">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sage-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={isTherapistOrAdmin ? "Buscar por paciente, terapia, objetivos o especialista..." : "Buscar por terapia, objetivos o especialista..."}
          className="w-full bg-natural-card border border-sage-200 text-ink-700 text-xs py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 shadow-sm"
        />
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-natural-card border border-sage-200/50 rounded-2xl p-10 text-center space-y-3" id="no-records">
          <div className="w-12 h-12 bg-natural-bg rounded-full flex items-center justify-center text-sage-400 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-olive-800 text-sm">No se encontraron registros</h3>
          <p className="text-xs text-sage-600 max-w-sm mx-auto">
            Aún no se han registrado fichas clínicas coincidentes para tus sesiones terapéuticas.
          </p>
        </div>
      ) : (
        <div className="space-y-4" id="records-list">
          {filteredRecords.map(rec => {
            const isExpanded = expandedRecordId === rec.id;
            const patientName = patients.find(p => p.uid === rec.patientId)?.name || 'Paciente de la Clínica';
            
            return (
              <div 
                key={rec.id}
                className="bg-natural-card rounded-2xl border border-sage-200/40 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Visible Header of Card */}
                <div 
                  onClick={() => toggleExpandRecord(rec.id)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-olive-50/20 transition select-none"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-olive-800 font-serif italic">{rec.therapyType}</span>
                      <span className="text-[10px] font-bold bg-sage-100 text-sage-800 px-2 py-0.5 rounded-full border border-sage-200/50">Ficha Evolución</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-sage-600">
                      {isTherapistOrAdmin && (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-sage-400" />
                          <span className="font-bold text-sage-700">{patientName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sage-400" />
                        <span>Fecha: {rec.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-olive-600" />
                        <span className="text-sage-700 font-semibold">Por: {rec.therapistName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sage-400 p-1 rounded-lg hover:bg-sage-100">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded Clinical details */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-sage-200/40 bg-natural-bg/50 space-y-4 text-xs">
                    {/* Objectives */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-olive-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <BookOpen className="w-3.5 h-3.5 text-sage-400" />
                        <span>Objetivo Principal</span>
                      </h4>
                      <p className="text-ink-700 bg-natural-card p-3 rounded-xl border border-sage-200/30 leading-relaxed font-semibold">
                        {rec.objective}
                      </p>
                    </div>

                    {/* Performance and Evolution details */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-olive-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <FileText className="w-3.5 h-3.5 text-sage-400" />
                        <span>Evolución de la Sesión</span>
                      </h4>
                      <p className="text-ink-700 bg-natural-card p-3.5 rounded-xl border border-sage-200/30 leading-relaxed">
                        {rec.evolution}
                      </p>
                    </div>

                    {/* Recommendations and Homework */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-olive-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <CheckCircle className="w-3.5 h-3.5 text-olive-600" />
                        <span>Recomendaciones para el Hogar</span>
                      </h4>
                      <p className="text-sage-800 bg-olive-50/25 p-3.5 rounded-xl border border-olive-200/40 leading-relaxed italic font-medium">
                        &ldquo;{rec.recommendations}&rdquo;
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
