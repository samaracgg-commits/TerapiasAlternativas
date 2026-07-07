import React from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Compass, 
  Car, 
  Train, 
  ExternalLink, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';

export const LocationPanel: React.FC = () => {
  const address = "Calle de Serrano, 45, Distrito de Salamanca, 28001 Madrid, España";
  const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.2882888258384!2d-3.6886476!3d40.4246835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd4228990c88bc61%3A0x6b8a8bbf37c68a4d!2sC.%20de%20Serrano%2C%2045%2C%20Salamanca%2C%2028001%20Madrid%2C%20Espa%C3%B1a!5e0!3m2!1ses!2ses!4v1710000000000!5m2!1ses!2ses";
  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-300" id="location-panel">
      
      {/* Intro Header */}
      <div className="border-b border-sage-200/50 pb-5">
        <h2 className="text-xl font-serif italic font-bold text-olive-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-olive-600" />
          Ubicación y Dirección de Clínica Sinergia
        </h2>
        <p className="text-xs text-sage-600 mt-1 leading-relaxed">
          Encuentra nuestras instalaciones principales en Madrid. Diseñadas para brindar accesibilidad total, calidez y equipamiento de última generación para tu bienestar y tus terapias.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Map and details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-natural-card rounded-2xl border border-sage-200/40 shadow-sm overflow-hidden p-1.5" id="map-container-wrapper">
            <div className="relative rounded-xl overflow-hidden h-[380px] w-full bg-sage-50" id="google-map-frame-box">
              <iframe
                title="Google Maps - Clínica Sinergia"
                src={mapEmbedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-natural-bg/40 rounded-xl mt-1.5 border border-sage-100">
              <div className="flex items-start gap-2.5">
                <Compass className="w-5 h-5 text-olive-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-serif font-bold text-olive-800">¿Utilizas GPS?</h4>
                  <p className="text-[11px] text-sage-600 mt-0.5">Haz clic para abrir directamente en Google Maps o Apple Maps.</p>
                </div>
              </div>
              <a
                href={externalMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-olive-600 hover:bg-olive-700 text-white font-semibold text-[11px] py-2 px-4 rounded-xl shadow-sm transition shrink-0 cursor-pointer"
              >
                <span>Cómo Llegar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Access Options & Accessibility */}
          <div className="bg-natural-card rounded-2xl border border-sage-200/40 p-6 space-y-4 shadow-sm" id="accessibility-details">
            <h3 className="text-sm font-serif font-bold text-olive-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-olive-600" />
              Instalaciones y Accesibilidad
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-sage-700 leading-relaxed">
                  <span className="font-bold block text-ink-700">Acceso Adaptado</span>
                  Rampas, puertas anchas y ascensores listos para camillas y sillas de ruedas.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-sage-700 leading-relaxed">
                  <span className="font-bold block text-ink-700">Área de Lactancia</span>
                  Espacio tranquilo y privado para madres y bebés durante sus consultas.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-sage-700 leading-relaxed">
                  <span className="font-bold block text-ink-700">Salas de Espera Sensoriales</span>
                  Iluminación regulable y ambiente auditivo ideal para personas neurodiversas.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-sage-700 leading-relaxed">
                  <span className="font-bold block text-ink-700">Aparcamiento Concertado</span>
                  Tarifa especial para pacientes en el parking subterráneo adyacente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact info cards, transport, hours */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-natural-card rounded-2xl border border-sage-200/40 p-6 space-y-4 shadow-sm" id="main-contact-card">
            <h3 className="text-sm font-serif font-bold text-olive-800 uppercase tracking-wide">Dónde Estamos</h3>
            
            <div className="space-y-4">
              {/* Address detail */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-olive-50 text-olive-800 flex items-center justify-center shrink-0 border border-olive-100">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-sage-500 uppercase">Dirección Principal</h4>
                  <p className="text-xs text-ink-700 font-semibold mt-0.5 leading-relaxed">
                    {address}
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-olive-50 text-olive-800 flex items-center justify-center shrink-0 border border-olive-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-sage-500 uppercase">Horario de Atención</h4>
                  <p className="text-xs text-ink-700 font-semibold mt-0.5">
                    Lunes a Viernes: 08:00h - 21:00h
                  </p>
                  <p className="text-xs text-sage-600">
                    Sábados: 09:00h - 14:00h (Solo citas previas)
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    Domingos y Festivos: Cerrado
                  </p>
                </div>
              </div>

              {/* Phones */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-olive-50 text-olive-800 flex items-center justify-center shrink-0 border border-olive-100">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-sage-500 uppercase">Llámanos</h4>
                  <p className="text-xs text-ink-700 font-bold mt-0.5">
                    +34 912 345 678
                  </p>
                  <p className="text-[11px] text-sage-600">
                    Soporte Directo: +34 600 112 233
                  </p>
                </div>
              </div>

              {/* Mail */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-olive-50 text-olive-800 flex items-center justify-center shrink-0 border border-olive-100">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-sage-500 uppercase">Correo Electrónico</h4>
                  <p className="text-xs text-ink-700 font-semibold mt-0.5">
                    contacto@clinicasinergia.com
                  </p>
                  <p className="text-[11px] text-sage-600">
                    administracion@clinicasinergia.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transportation Guide Card */}
          <div className="bg-natural-card rounded-2xl border border-sage-200/40 p-6 space-y-4 shadow-sm" id="transportation-guide">
            <h3 className="text-sm font-serif font-bold text-olive-800 uppercase tracking-wide">Cómo Llegar a la Clínica</h3>
            
            <div className="space-y-4">
              {/* Public Train / Metro */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                  <Train className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-700">Metro y Autobús</h4>
                  <p className="text-[11px] text-sage-600 mt-0.5 leading-relaxed">
                    <span className="font-semibold text-blue-800">Línea 4 (Serrano)</span> a 2 minutos andando.
                  </p>
                  <p className="text-[11px] text-sage-600 leading-relaxed">
                    <span className="font-semibold text-blue-800">Líneas 5 y 9 (Núñez de Balboa)</span> a 5 minutos andando.
                  </p>
                  <p className="text-[11px] text-sage-600 leading-relaxed">
                    Autobuses EMT: <span className="font-medium bg-sage-100 text-sage-800 px-1 py-0.5 rounded text-[10px]">9</span>, <span className="font-medium bg-sage-100 text-sage-800 px-1 py-0.5 rounded text-[10px]">19</span>, <span className="font-medium bg-sage-100 text-sage-800 px-1 py-0.5 rounded text-[10px]">51</span>, <span className="font-medium bg-sage-100 text-sage-800 px-1 py-0.5 rounded text-[10px]">74</span> parada Serrano-Ortega y Gasset.
                  </p>
                </div>
              </div>

              {/* Private Car */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center shrink-0 border border-orange-100">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-700">Coche y Aparcamiento</h4>
                  <p className="text-[11px] text-sage-600 mt-0.5 leading-relaxed">
                    Fácil acceso desde la M-30 por Calle de Alcalá o Paseo de la Castellana.
                  </p>
                  <p className="text-[11px] text-sage-600 leading-relaxed">
                    Recomendamos el <span className="font-semibold text-orange-800">Parking Serrano Park II</span> situado bajo la calle de Serrano, con acceso directo frente a la clínica.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
