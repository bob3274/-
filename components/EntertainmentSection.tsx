
import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, MediaType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { generateMediaCSV, parseMediaCSV, downloadCSV } from '../utils/csvHelper';

const EntertainmentSection: React.FC = () => {
  const { t } = useLanguage();
  const { getUserStorageKey } = useUser();
  const [activeTab, setActiveTab] = useState<MediaType>(MediaType.ANIME);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  
  // Form
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<MediaItem['status']>('Watching');
  const [link, setLink] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageKey = getUserStorageKey('media');

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
        // Auto-check for 'media_db.csv'
        if (items.length === 0) {
            fetch('/media_db.csv')
              .then(res => {
                if (res.ok) return res.text();
                throw new Error('No default DB');
              })
              .then(text => {
                const parsed = parseMediaCSV(text);
                if (parsed.length > 0) setItems(parsed);
              })
              .catch(() => {});
        } else {
            setItems([]);
        }
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const filteredItems = items.filter(item => item.type === activeTab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newItem: MediaItem = {
      id: Date.now().toString(),
      type: activeTab,
      title,
      status,
      link,
      addedAt: Date.now(),
    };

    setItems([newItem, ...items]);
    setTitle('');
    setLink('');
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

   // CSV Handlers
  const handleExportCSV = () => {
    const csvContent = generateMediaCSV(items);
    downloadCSV(csvContent, `media_db_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const newItems = parseMediaCSV(evt.target?.result as string);
        setItems(prev => [...newItems, ...prev]);
        alert(t('importSuccess'));
      } catch(err) { alert(t('importError')); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };


  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{t('entertainment')}</h2>
          <p className="text-slate-400 mt-1">{t('mediaSubtitle')}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
             <div className="flex bg-card p-1 rounded-lg border border-slate-700">
              {Object.values(MediaType).map((type) => (
                  <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                      activeTab === type 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  >
                  {type}
                  </button>
              ))}
              </div>
               {/* CSV */}
              <div className="flex gap-2 items-center">
                  <button onClick={() => setShowCsvHelp(!showCsvHelp)} className="text-slate-400 hover:text-white text-sm underline mr-2">{t('csvHelp')}</button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600 text-sm">📥</button>
                  {items.length > 0 && <button onClick={handleExportCSV} className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600 text-sm">📤</button>}
              </div>
          </div>
          {showCsvHelp && (
             <div className="bg-slate-800 p-2 rounded text-xs text-slate-300 border border-slate-600 max-w-md">
                {t('csvFormatMedia')}
             </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-xl border border-slate-700 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">{t('addMedia')} {activeTab}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('title')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-dark border border-slate-600 rounded-lg p-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  placeholder={`e.g. One Piece`}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('status')}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-dark border border-slate-600 rounded-lg p-2.5 text-white focus:border-primary outline-none"
                >
                  <option value="Watching">{t('watching')}</option>
                  <option value="Plan to Watch">{t('planToWatch')}</option>
                  <option value="Completed">{t('completed')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('link')}</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full bg-dark border border-slate-600 rounded-lg p-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  placeholder="https://..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                {t('addItem')}
              </button>
            </form>
          </div>
        </div>

        {/* Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-card rounded-xl border border-slate-700 overflow-hidden hover:border-primary/50 transition group relative">
                <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-700 p-4 flex flex-col justify-between relative">
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                      item.status === 'Completed' ? 'bg-green-500' :
                      item.status === 'Watching' ? 'bg-amber-500' : 'bg-slate-500'
                    }`}>
                      {item.status === 'Watching' ? t('watching') : item.status === 'Completed' ? t('completed') : t('planToWatch')}
                    </span>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-white/50 hover:text-white transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-4 -mt-6 relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-darker border-2 border-card flex items-center justify-center text-2xl shadow-md mb-3">
                    {item.type === MediaType.YOUTUBE ? '📺' : 
                     item.type === MediaType.ANIME ? '🎌' : 
                     item.type === MediaType.MANGA ? '📖' : '🎭'}
                  </div>
                  <h4 className="text-white font-semibold text-lg truncate" title={item.title}>{item.title}</h4>
                  {item.link && (
                    <a 
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-sm hover:underline mt-2 inline-block"
                    >
                      {t('openLink')} →
                    </a>
                  )}
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                No items in {activeTab} yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntertainmentSection;
