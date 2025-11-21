
import React, { useState, useEffect, useRef } from 'react';
import { MusicItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { generateMusicCSV, parseMusicCSV, downloadCSV } from '../utils/csvHelper';

const MusicSection: React.FC = () => {
  const { t } = useLanguage();
  const { getUserStorageKey } = useUser();
  const [items, setItems] = useState<MusicItem[]>([]);
  const [artist, setArtist] = useState('');
  const [song, setSong] = useState('');
  const [url, setUrl] = useState('');
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get isolated key
  const storageKey = getUserStorageKey('music');

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      // Auto-check for 'music_db.csv' if no local data exists
      if (items.length === 0) {
        fetch('/music_db.csv')
          .then(res => {
            if (res.ok) return res.text();
            throw new Error('No default DB');
          })
          .then(text => {
            const parsed = parseMusicCSV(text);
            if (parsed.length > 0) setItems(parsed);
          })
          .catch(() => {
             // No default file found, ignore
          });
      } else {
         setItems([]);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (items.length > 0) {
       localStorage.setItem(storageKey, JSON.stringify(items));
    } else {
        // Handle empty state save if needed, but usually we don't overwrite with empty unless explicit delete
         localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, storageKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist || !song) return;

    const newItem: MusicItem = {
      id: Date.now().toString(),
      artist,
      song,
      url,
      addedAt: Date.now(),
    };

    setItems([newItem, ...items]);
    setArtist('');
    setSong('');
    setUrl('');
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // CSV Handlers
  const handleExportCSV = () => {
    const csvContent = generateMusicCSV(items);
    downloadCSV(csvContent, `music_db_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const newItems = parseMusicCSV(evt.target?.result as string);
        setItems(prev => [...newItems, ...prev]);
        alert(t('importSuccess'));
      } catch(err) { alert(t('importError')); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{t('musicLibrary')}</h2>
          <p className="text-slate-400 mt-1">{t('musicSubtitle')}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
               <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded-full text-slate-300 hidden sm:inline-block">
                {items.length} Songs
               </span>
               <button 
                 onClick={() => setShowCsvHelp(!showCsvHelp)}
                 className="text-slate-400 hover:text-white text-sm underline"
               >
                 {t('csvHelp')}
               </button>
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
               <button onClick={() => fileInputRef.current?.click()} className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600" title={t('importCsv')}>📥</button>
               {items.length > 0 && (
                 <button onClick={handleExportCSV} className="bg-slate-700 text-white p-2 rounded hover:bg-slate-600" title={t('exportCsv')}>📤</button>
               )}
            </div>
            {showCsvHelp && (
              <div className="bg-slate-800 p-2 rounded text-xs text-slate-300 border border-slate-600 max-w-xs">
                {t('csvFormatMusic')}
              </div>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form */}
        <div className="lg:col-span-1">
          <div className="bg-card p-6 rounded-xl border border-slate-700 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">{t('addSong')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('artist')}</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-dark border border-slate-600 rounded-lg p-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  placeholder="e.g. YOASOBI"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('songTitle')}</label>
                <input
                  type="text"
                  value={song}
                  onChange={(e) => setSong(e.target.value)}
                  className="w-full bg-dark border border-slate-600 rounded-lg p-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  placeholder="e.g. Idol"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('streamUrl')}</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-dark border border-slate-600 rounded-lg p-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  placeholder="Spotify / YouTube Link"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                {t('addToLibrary')}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-card/50 rounded-xl border border-dashed border-slate-700">
              <p>{t('noMusic')}</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="group bg-card p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:border-slate-500 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xl">
                    🎵
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{item.song}</h4>
                    <p className="text-sm text-slate-400">{item.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:text-blue-400 text-sm font-medium px-3 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition"
                    >
                      {t('play')}
                    </a>
                  )}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-500 hover:text-red-400 p-2 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicSection;
