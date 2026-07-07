import React from 'react';
import { BookOpen, HelpCircle, Activity, ShieldAlert, Sparkles, Smile } from 'lucide-react';

export const TherapyGuide: React.FC = () => {
  const guides = [
    {
      title: 'Fisioterapia / Psicomotricidad',
      purpose: 'Mejorar el tono muscular, la postura, la fuerza, el equilibrio y la coordinación motriz gruesa.',
      indications: 'Parálisis cerebral, retraso del desarrollo motor, hipotonía, secuelas post-traumáticas, escoliosis.',
      tips: 'Realizar estiramientos pasivos suaves por la mañana. Mantener rutinas de caminata descalzo sobre superficies seguras para estimular receptores.',
      color: 'bg-olive-100/40 border-olive-200 text-olive-850'
    },
    {
      title: 'Terapia Ocupacional / Integración Sensorial',
      purpose: 'Desarrollar habilidades de motricidad fina, destrezas de la vida diaria y procesamiento sensorial equilibrado.',
      indications: 'Trastorno del Espectro Autista (TEA), TDAH, disfunción de integración sensorial, retraso madurativo.',
      tips: 'Establecer agendas visuales estructuradas para transiciones diarias. Proveer masajes de presión profunda o mantas de peso durante crisis de desregulación.',
      color: 'bg-sage-100/50 border-sage-200 text-sage-850'
    },
    {
      title: 'Terapia del Habla y Lenguaje',
      purpose: 'Mejorar la articulación verbal, la comprensión, la expresión comunicativa, el lenguaje no verbal y la deglución.',
      indications: 'Disfasia, apraxia del habla, retraso del habla, tartamudez, dificultades en masticación o alimentación.',
      tips: 'Hablar de frente mirándole a los ojos con frases claras y sencillas. Utilizar juegos de soplo (burbujas, silbatos) para fortalecer musculatura bucofacial.',
      color: 'bg-sand-100/50 border-sand-300 text-sand-850'
    },
    {
      title: 'Psicología Infantil y Apoyo Familiar',
      purpose: 'Abordar aspectos emocionales, de conducta, socialización y brindar orientación a padres.',
      indications: 'Ansiedad, problemas de comportamiento, bajo rendimiento escolar, duelo, orientación en pautas de crianza.',
      tips: 'Dedicar al menos 15 minutos diarios de juego libre exclusivo dirigido por el niño, sin pantallas ni interrupciones, validando sus emociones siempre.',
      color: 'bg-olive-50 border-olive-100 text-olive-800'
    }
  ];

  return (
    <div className="space-y-6" id="therapy-guide">
      {/* Title block */}
      <div className="border-b border-sage-100 pb-5">
        <h2 className="text-xl font-bold font-serif text-olive-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-olive-600" />
          <span>Guía Educativa de Terapias</span>
        </h2>
        <p className="text-xs text-sage-600 mt-1">
          Información científica y pautas terapéuticas prácticas para realizar en el entorno del hogar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="guides-grid">
        {guides.map((guide, i) => (
          <div 
            key={i}
            className="bg-natural-card border border-sage-200/40 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-sage-200/20 pb-3">
                <h3 className="font-serif font-bold text-olive-800 text-sm">{guide.title}</h3>
                <div className="w-2.5 h-2.5 rounded-full bg-olive-600 shrink-0"></div>
              </div>

              {/* Purpose */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-sage-500 block tracking-wider">Objetivo Terapéutico</span>
                <p className="text-xs text-sage-700 leading-relaxed font-semibold">{guide.purpose}</p>
              </div>

              {/* Indications */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-sage-500 block tracking-wider">Principales Indicaciones</span>
                <p className="text-xs text-sage-700 leading-relaxed font-semibold">{guide.indications}</p>
              </div>
            </div>

            {/* Tips for home */}
            <div className={`mt-5 p-4 rounded-xl border ${guide.color} space-y-1.5`}>
              <h4 className="font-bold text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-olive-600 shrink-0" />
                <span>Recomendación Práctica para el Hogar</span>
              </h4>
              <p className="text-[11px] leading-relaxed italic font-medium">
                &ldquo;{guide.tips}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Safety warning */}
      <div className="bg-sand-100/50 border border-sand-300/60 rounded-2xl p-4 flex gap-3 text-sand-850">
        <ShieldAlert className="w-5 h-5 text-sand-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-sand-850">Importante: Seguimiento Profesional</h4>
          <p className="text-[11px] leading-relaxed font-semibold text-sand-800">
            Las recomendaciones en casa complementan pero nunca sustituyen la intervención presencial individualizada de tu terapeuta asignado. Ante cualquier síntoma adverso, suspende la actividad y consulta directamente a tu especialista de Clínica Sinergia.
          </p>
        </div>
      </div>
    </div>
  );
};
