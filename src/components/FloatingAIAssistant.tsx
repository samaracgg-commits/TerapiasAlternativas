import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  X, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Calendar, 
  Activity,
  Maximize2,
  Minimize2,
  CornerDownLeft
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const FloatingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const faqSuggestions = [
    { text: '¿Cuáles son los horarios de atención?', icon: Clock },
    { text: '¿Qué especialidades terapéuticas ofrecen?', icon: Activity },
    { text: '¿Cómo agendar o ver mis citas?', icon: Calendar },
    { text: '¿Dónde se encuentra la clínica?', icon: MapPin },
  ];

  // Load initial welcome message if empty
  useEffect(() => {
    const savedMessages = localStorage.getItem('sinergia_floating_chat');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Error parsing saved chat history:', e);
      }
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: '¡Hola! Soy el Asistente Virtual de Clínica Sinergia. ✨\n\n¿Tienes alguna duda sobre nuestras especialidades, horarios, ubicación o sobre cómo funciona este portal clínico? Estoy aquí para ayudarte.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    // Hide tooltip after some time
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  // Save chat messages to localstorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('sinergia_floating_chat', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatBoxRef.current && !chatBoxRef.current.contains(event.target as Node)) {
        // Only close if screen size is desktop to avoid accidental touch issues
        if (window.innerWidth > 768 && isOpen) {
          // Keep it open or closed based on preference, let's keep it open for better user retention
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Keep only last 5 messages for context
      const apiHistory = messages.slice(-5).map(m => ({
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error in Floating AI Assistant request:', error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Disculpa, tuve un problema al procesar tu solicitud. Por favor reintenta en unos instantes.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('¿Quieres reiniciar la conversación?')) {
      const initialWelcome = [
        {
          id: 'welcome',
          role: 'assistant',
          text: '¡Hola! Soy el Asistente Virtual de Clínica Sinergia. ✨\n\n¿Tienes alguna duda sobre nuestras especialidades, horarios, ubicación o sobre cómo funciona este portal clínico? Estoy aquí para ayudarte.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initialWelcome);
      localStorage.setItem('sinergia_floating_chat', JSON.stringify(initialWelcome));
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans" id="floating-ai-widget">
      {/* Tooltip Badge */}
      {showTooltip && !isOpen && (
        <div className="absolute bottom-16 right-2 bg-olive-700 text-white text-[11px] font-semibold py-2 px-3.5 rounded-2xl shadow-xl flex items-center gap-2 mb-2 animate-bounce border border-olive-600 max-w-[240px] leading-tight">
          <Sparkles className="w-3.5 h-3.5 text-sand-300 fill-sand-300/20 shrink-0" />
          <span>¿Dudas? Chatea con Sinergia AI</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-white/70 hover:text-white p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Chat Container Overlay */}
      {isOpen && (
        <div 
          ref={chatBoxRef}
          className="bg-natural-card border border-sage-200/60 rounded-3xl shadow-2xl w-[90vw] sm:w-[380px] h-[480px] flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-5 duration-200"
          id="floating-chat-container"
        >
          {/* Header */}
          <div className="bg-olive-800 text-white p-4 flex items-center justify-between border-b border-olive-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-olive-700/60 border border-olive-600 flex items-center justify-center text-lg shadow-inner">
                ✨
              </div>
              <div>
                <h4 className="font-serif font-bold text-xs tracking-tight">Sinergia AI</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                  <span className="text-[9px] text-olive-100 font-semibold tracking-wide">Asistente Virtual Activo</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleResetChat}
                className="p-1.5 hover:bg-olive-700/50 rounded-lg text-olive-200 hover:text-white transition"
                title="Reiniciar chat"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-olive-700/50 rounded-lg text-olive-200 hover:text-white transition"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3.5 bg-natural-bg/30">
            {messages.map((msg) => {
              const isOwn = msg.role === 'user';
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwn && (
                    <div className="w-6 h-6 rounded-lg bg-olive-100 text-olive-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✨
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] space-y-0.5 ${isOwn ? 'order-1' : 'order-2'}`}>
                    <div className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm whitespace-pre-line ${
                      isOwn 
                        ? 'bg-olive-600 text-white rounded-br-none font-semibold' 
                        : 'bg-natural-card border border-sage-200/40 text-ink-700 rounded-bl-none font-medium'
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[8px] block text-sage-500 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-olive-100 text-olive-800 flex items-center justify-center font-bold text-[10px] shrink-0 animate-pulse">
                  ✨
                </div>
                <div className="bg-natural-card border border-sage-200/40 px-3 py-2.5 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-1.5">
                  <span className="text-[10px] text-sage-500 italic">Escribiendo</span>
                  <div className="flex space-x-0.5">
                    <span className="w-1 h-1 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-1 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-1 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Suggestion Pills inside messages frame if empty or small */}
            {messages.length < 3 && !isTyping && (
              <div className="pt-2 space-y-2" id="floating-suggestions">
                <p className="text-[10px] text-sage-500 font-bold uppercase tracking-wider">Preguntas rápidas:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {faqSuggestions.map((sug, i) => {
                    const SugIcon = sug.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug.text)}
                        className="p-2 text-left bg-natural-card hover:bg-olive-50/50 border border-sage-200/40 rounded-xl text-[10px] font-semibold text-ink-700 transition flex items-center gap-1.5 cursor-pointer leading-tight shadow-sm"
                      >
                        <SugIcon className="w-3 h-3 text-olive-600 shrink-0" />
                        <span className="truncate">{sug.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 border-t border-sage-200/50 flex gap-2 items-center bg-natural-card"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
              placeholder="Pregúntale a Sinergia AI..."
              className="flex-grow bg-natural-bg border border-sage-200/80 text-[11px] py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/10 focus:border-olive-500 text-ink-700"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="bg-olive-600 hover:bg-olive-700 text-white p-2 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Primary Action Floating Circular Bubble */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition duration-300 transform hover:scale-105 cursor-pointer border relative ${
          isOpen 
            ? 'bg-natural-card border-sage-200 text-olive-800' 
            : 'bg-olive-600 border-olive-500 text-white'
        }`}
        id="btn-floating-ai-assistant"
        title="Preguntas frecuentes con Sinergia AI"
      >
        {isOpen ? (
          <X className="w-5 h-5 animate-spin-once" />
        ) : (
          <div className="relative">
            <Sparkles className="w-6 h-6 fill-white/10 animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-sand-400 border-2 border-olive-600 rounded-full"></span>
          </div>
        )}
      </button>
    </div>
  );
};
