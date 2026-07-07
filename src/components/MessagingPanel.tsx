import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Message, THERAPISTS } from '../types';
import { sendMessage } from '../lib/db';
import { 
  Send, 
  User, 
  MessageSquare, 
  MessageCircle, 
  Search, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MessagingPanelProps {
  currentUser: UserProfile;
  messages: Message[];
  patients: UserProfile[];
}

export const MessagingPanel: React.FC<MessagingPanelProps> = ({ currentUser, messages, patients }) => {
  const isTherapistOrAdmin = currentUser.role === 'therapist' || currentUser.role === 'admin';
  const chatEndRef = useRef<HTMLDivElement>(null);

  // States
  const [selectedContact, setSelectedContact] = useState<UserProfile | { uid: string; name: string; role: string } | null>(null);
  const [msgText, setMsgText] = useState('');
  const [contactSearch, setContactSearch] = useState('');

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  // List of contacts available to chat
  const availableContacts = isTherapistOrAdmin
    ? patients // Therapists can chat with all patients
    : THERAPISTS.map(t => ({ uid: t.uid, name: t.name, role: 'therapist', email: '' })); // Patients can chat with therapists

  const filteredContacts = availableContacts.filter(c => 
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // Filter messages for current active chat
  const activeChatMessages = selectedContact
    ? messages.filter(msg => 
        (msg.senderId === currentUser.uid && msg.receiverId === selectedContact.uid) ||
        (msg.senderId === selectedContact.uid && msg.receiverId === currentUser.uid)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedContact) return;

    const currentMsgText = msgText;
    setMsgText(''); // Clear input instantly for snappy real-time UI

    try {
      await sendMessage(currentUser.uid, currentUser.name, selectedContact.uid, currentMsgText);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="bg-natural-card border border-sage-200/50 rounded-2xl shadow-sm h-[550px] flex overflow-hidden" id="messaging-panel">
      {/* Sidebar - Contacts List */}
      <div className="w-1/3 border-r border-sage-200/50 flex flex-col bg-natural-bg/40" id="chat-sidebar">
        {/* Search header */}
        <div className="p-4 border-b border-sage-200/50 bg-natural-card">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sage-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Buscar contacto..."
              className="w-full bg-natural-bg border border-sage-200/50 text-ink-700 text-xs py-2 pl-9 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/15"
            />
          </div>
        </div>

        {/* Contacts scrolling area */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1.5" id="chat-contacts-list">
          {filteredContacts.length === 0 ? (
            <div className="text-center text-xs text-sage-500 py-8">
              No hay contactos.
            </div>
          ) : (
            filteredContacts.map(contact => {
              const isSelected = selectedContact?.uid === contact.uid;
              
              // Find last message for badge/preview
              const lastMsg = messages
                .filter(m => 
                  (m.senderId === currentUser.uid && m.receiverId === contact.uid) ||
                  (m.senderId === contact.uid && m.receiverId === currentUser.uid)
                )
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

              return (
                <div
                  key={contact.uid}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-3.5 rounded-xl cursor-pointer transition flex items-center gap-3 select-none ${
                    isSelected 
                      ? 'bg-olive-600 text-white shadow-md shadow-olive-600/15' 
                      : 'bg-natural-card hover:bg-olive-50/30 border border-sage-200/20'
                  }`}
                >
                  <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-natural-bg text-olive-800'
                  }`}>
                    {contact.name.charAt(0)}
                  </div>
                  
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs truncate block">{contact.name}</span>
                    </div>
                    <span className={`text-[10px] block truncate mt-0.5 ${isSelected ? 'text-sand-100' : 'text-sage-500'}`}>
                      {lastMsg ? lastMsg.text : (contact.role === 'therapist' ? 'Terapeuta' : 'Paciente')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat window */}
      <div className="w-2/3 flex flex-col justify-between bg-natural-card" id="chat-window">
        {selectedContact ? (
          <>
            {/* Active chat header */}
            <div className="p-4 border-b border-sage-200/50 flex items-center justify-between bg-natural-bg/30" id="chat-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-olive-100 text-olive-800 flex items-center justify-center text-sm font-bold">
                  {selectedContact.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-xs text-olive-800 block leading-tight">{selectedContact.name}</span>
                  <span className="text-[10px] text-olive-700 font-bold">● Conectado - Tiempo real</span>
                </div>
              </div>
              <div className="text-[10px] bg-sage-100 text-sage-800 px-2 py-0.5 rounded-full font-bold border border-sage-200 uppercase tracking-wide">
                Chat Sincrónico
              </div>
            </div>

            {/* Scrolling messages screen */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-natural-bg/25" id="chat-messages-screen">
              {activeChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-sage-500 space-y-2">
                  <MessageCircle className="w-8 h-8 text-sage-400" />
                  <p className="text-xs">Inicia la conversación enviando un mensaje directo.</p>
                </div>
              ) : (
                activeChatMessages.map(msg => {
                  const isOwn = msg.senderId === currentUser.uid;
                  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] space-y-1 ${isOwn ? 'order-1' : 'order-2'}`}>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isOwn 
                            ? 'bg-olive-600 text-white rounded-br-none font-medium' 
                            : 'bg-natural-card border border-sage-200/40 text-ink-700 rounded-bl-none font-medium'
                        }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[9px] block ${isOwn ? 'text-right text-sage-500' : 'text-left text-sage-500'}`}>
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSend} className="p-4 border-t border-sage-200/50 flex gap-3 items-center bg-natural-card" id="chat-input-form">
              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Escribe un mensaje en tiempo real..."
                className="flex-grow bg-natural-bg border border-sage-200 text-ink-700 text-xs py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500/15 focus:border-olive-500"
              />
              <button
                type="submit"
                className="bg-olive-600 hover:bg-olive-700 text-white p-2.5 rounded-xl transition duration-150 shadow-md shadow-olive-600/10 cursor-pointer"
                id="btn-send-message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3" id="chat-unselected">
            <div className="w-16 h-16 bg-natural-bg rounded-full flex items-center justify-center text-sage-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-bold font-serif text-olive-800 text-sm">Mensajería Instantánea</h3>
            <p className="text-xs text-sage-600 max-w-xs leading-relaxed">
              {isTherapistOrAdmin
                ? 'Selecciona a un paciente de la lista izquierda para iniciar soporte terapéutico instantáneo.'
                : 'Selecciona a un terapeuta especialista de la lista izquierda para comunicarte.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
