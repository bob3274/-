
import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';

const MessageBoardSection: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useUser();
  
  // Shared Key for "Real-time" simulation via LocalStorage event
  const STORAGE_KEY = 'myhub_shared_messages';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [retentionHours, setRetentionHours] = useState<number>(24); // Default 24h
  const [showSettings, setShowSettings] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages
  const loadMessages = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      let parsed: Message[] = JSON.parse(saved);
      const now = Date.now();
      // Filter expired
      parsed = parsed.filter(m => !m.expiresAt || m.expiresAt > now);
      setMessages(parsed);
    }
  };

  useEffect(() => {
    loadMessages();

    // Poll for changes (Simulate real-time for single browser multiple tabs or if we had backend)
    const interval = setInterval(loadMessages, 2000);

    // Listen for storage events (Tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadMessages();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Auto scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      userId: currentUser.id,
      userName: currentUser.name,
      content: inputText,
      timestamp: Date.now(),
      expiresAt: retentionHours > 0 ? Date.now() + (retentionHours * 60 * 60 * 1000) : undefined
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
    setInputText('');
  };

  const handleClearExpired = () => {
     const now = Date.now();
     const clean = messages.filter(m => !m.expiresAt || m.expiresAt > now);
     setMessages(clean);
     localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      <header className="flex justify-between items-center border-b border-slate-700 pb-4 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white">{t('messageBoard')}</h2>
          <p className="text-slate-400 mt-1">{t('messageSubtitle')}</p>
        </div>
        <div className="relative">
           <button 
             onClick={() => setShowSettings(!showSettings)}
             className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
           >
             ⚙️ {t('settings')}
           </button>
           
           {showSettings && (
             <div className="absolute right-0 top-full mt-2 bg-card border border-slate-700 p-4 rounded-xl shadow-xl w-64 z-10 animate-fade-in">
               <h4 className="text-sm font-bold text-white mb-2">{t('retentionTime')}</h4>
               <p className="text-xs text-slate-500 mb-3">{t('retentionDesc')}</p>
               <div className="space-y-2">
                  {[1, 12, 24, 72, 0].map(h => (
                    <button
                      key={h}
                      onClick={() => setRetentionHours(h)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${retentionHours === h ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                      {h === 0 ? t('forever') : `${h} ${t('hours')}`}
                    </button>
                  ))}
               </div>
             </div>
           )}
        </div>
      </header>

      {/* Message List */}
      <div 
        className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700 overflow-y-auto p-4 custom-scrollbar space-y-4"
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            {t('noMessages')}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUser.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold ${isMe ? 'text-primary' : 'text-slate-300'}`}>
                    {msg.userName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                  isMe 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-slate-700 text-slate-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('typeMessage')}
          className="flex-1 bg-card border border-slate-700 rounded-full px-6 py-3 text-white focus:border-primary outline-none transition shadow-sm"
        />
        <button 
          type="button" 
          onClick={handleClearExpired}
          className="hidden" 
        >
          {/* Hidden trigger for cleanup if needed manually */}
        </button>
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold px-6 rounded-full transition shadow-lg"
        >
          {t('send')}
        </button>
      </form>
    </div>
  );
};

export default MessageBoardSection;