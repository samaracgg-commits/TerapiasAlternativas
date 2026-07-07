import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  MessageSquare, 
  Trash2, 
  Clock, 
  MapPin, 
  Calendar, 
  Activity 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export const AIAssistantPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const faqSuggestions = [
    { text: '¿Cuáles son los horarios de atención?', icon: Clock },
    { text: '¿Qué especialidades terapéuticas ofrecen?', icon: Activity },
    { text: '¿Cómo agendar o ver mis citas?', icon: Calendar },
    { text: '¿Dónde se encuentra la clínica?', icon: MapPin },
  ];

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build simple conversation history for the API (only include the last few turns for brevity)
      const apiHistory = messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: apiHistory
        })
      });

      if (!response.ok) {
        throw new Error('La llamada al servidor falló');
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: data.text || 'Disculpa, no obtuve una respuesta válida.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error in AI Assistant FAQ request:', error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Lo siento, ocurrió un error temporal de conexión. Por favor asegúrate de que el servidor esté activo y reintenta.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('¿Deseas vaciar la conversación con el asistente?')) {
      setMessages([]);
    }
  };

  return (
    <div className="space-y-6" id="ai-assistant-panel">
      {/* Title Header */}
      <div className="border-b border-sage-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-olive-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-olive-600 fill-olive-500/15 animate-pulse" />
            <span>Asistente Clínico Inteligente (FAQ)</span>
          </h2>
          <p className="text-xs text-sage-600 mt-1">
            Consulta dudas rápidas sobre especialidades, horarios, guías, ubicaciones y pautas de Clínica Sinergia.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200/50 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            id="btn-clear-ai-chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Borrar historial</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="ai-assistant-grid">
        {/* Sidebar - FAQ Suggestions */}
        <div className="lg:col-span-1 space-y-4" id="ai-faq-sidebar">
          <div className="bg-natural-card border border-sage-200/40 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-olive-800 pb-2 border-b border-sage-100">
              <HelpCircle className="w-4 h-4 text-olive-600 shrink-0" />
              <h3 className="font-bold text-xs">Preguntas Frecuentes</h3>
            </div>
            <p className="text-[11px] text-sage-500 leading-relaxed">
              Haz clic en cualquiera de las siguientes preguntas frecuentes sugeridas para consultarla al asistente de manera instantánea:
            </p>
            <div className="space-y-2 pt-1">
              {faqSuggestions.map((suggestion, index) => {
                const SuggestionIcon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(suggestion.text)}
                    disabled={isTyping}
                    className="w-full text-left p-2.5 rounded-xl border border-sage-200/30 bg-natural-bg/25 hover:bg-olive-50/50 hover:border-sage-300 text-[11px] text-ink-700 font-semibold transition flex items-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-6 h-6 rounded-lg bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
                      <SuggestionIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="leading-snug">{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="bg-olive-50/50 border border-olive-200/30 rounded-2xl p-4 text-[11px] text-olive-800 leading-relaxed space-y-1.5 shadow-sm">
            <h4 className="font-bold flex items-center gap-1.5 text-olive-900">
              <Activity className="w-3.5 h-3.5 text-olive-600" />
              <span>Soporte Integrado</span>
            </h4>
            <p>
              Este chatbot utiliza modelos de lenguaje natural de Google para responder tus preguntas y orientarte con las recomendaciones del hogar. No emite recetas de medicamentos ni sustituye el diagnóstico personalizado.
            </p>
          </div>
        </div>

        {/* Chat Conversation Area */}
        <div className="lg:col-span-3 bg-natural-card border border-sage-200/50 rounded-2xl shadow-sm h-[520px] flex flex-col overflow-hidden" id="ai-assistant-chat-box">
          {/* Messages Scrolling Body */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-natural-bg/25" id="ai-messages-scroller">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-olive-100 text-olive-700 flex items-center justify-center animate-bounce">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h3 className="font-serif font-bold text-olive-800 text-sm">¿Cómo puedo ayudarte hoy?</h3>
                  <p className="text-xs text-sage-600 leading-relaxed">
                    Pregúntame sobre el portal, las especialidades médicas de Clínica Sinergia, el manual de terapia, los horarios de los consultorios o consejos para estiramientos en casa.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.role === 'user';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-olive-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          ✨
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] space-y-1 ${isOwn ? 'order-1' : 'order-2'}`}>
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                          isOwn 
                            ? 'bg-olive-600 text-white rounded-br-none font-semibold' 
                            : 'bg-natural-card border border-sage-200/40 text-ink-700 rounded-bl-none font-medium'
                        }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[9px] block text-sage-500 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {isOwn && (
                        <div className="w-8 h-8 rounded-full bg-sage-200 text-olive-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          👤
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-olive-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-pulse">
                      ✨
                    </div>
                    <div className="bg-natural-card border border-sage-200/40 p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1.5">
                      <span className="text-[11px] text-sage-500 italic font-semibold">Sinergia AI está formulando respuesta</span>
                      <div className="flex space-x-0.5">
                        <span className="w-1.5 h-1.5 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Typing Form Panel */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }} 
            className="p-4 border-t border-sage-200/50 flex gap-3 items-center bg-natural-card" 
            id="ai-chat-form"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
              placeholder="Escribe tu consulta sobre terapias, horarios u orientación..."
              className="flex-grow bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/15 focus:border-olive-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="bg-olive-600 hover:bg-olive-700 text-white p-2.5 rounded-xl transition duration-150 shadow-md shadow-olive-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              id="btn-send-ai-message"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
