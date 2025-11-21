
import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { generateDiaryCSV, parseDiaryCSV, downloadCSV } from '../utils/csvHelper';

const DiarySection: React.FC = () => {
  const { t } = useLanguage();
  const { getUserStorageKey } = useUser();
  const [items, setItems] = useState<DiaryEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  
  // Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // Modal State
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Form State
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mood, setMood] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const storageKey = getUserStorageKey('diary');

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
        // Auto-check for 'diary_db.csv'
        if (items.length === 0) {
            fetch('/diary_db.csv')
              .then(res => {
                if (res.ok) return res.text();
                throw new Error('No default DB');
              })
              .then(text => {
                const parsed = parseDiaryCSV(text);
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

  // --- Helper Functions ---

  // Image Handler (Original Quality - No Compression)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImages(prev => [...prev, result]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: DiaryEntry = {
      id: Date.now().toString(),
      date,
      content,
      mood,
      images,
      addedAt: Date.now(),
    };
    setItems([newItem, ...items]);
    setIsFormOpen(false);
    setContent('');
    setImages([]);
    setMood('');
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  const handleDownloadEntry = (entry: DiaryEntry) => {
    const textContent = `Date: ${entry.date}\nMood: ${entry.mood || 'None'}\n\n${entry.content}`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diary_${entry.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadImage = (base64: string, index: number, date: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `diary_${date}_img_${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Handlers
  const handleExportCSV = () => {
    const csvContent = generateDiaryCSV(items);
    downloadCSV(csvContent, `diary_db_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const newItems = parseDiaryCSV(evt.target?.result as string);
        setItems(prev => [...newItems, ...prev]); 
        alert(t('importSuccess'));
      } catch(err) { alert(t('importError')); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Filtering & Sorting ---
  const filteredItems = items
    .filter(item => {
      const lowerQ = searchTerm.toLowerCase();
      return (
        item.content.toLowerCase().includes(lowerQ) ||
        item.date.includes(lowerQ) ||
        (item.mood && item.mood.toLowerCase().includes(lowerQ))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{t('diary')}</h2>
          <p className="text-slate-400 mt-1">{t('diarySubtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
          
          {/* Search & Sort Bar */}
          <div className="flex items-center gap-2 w-full md:w-auto bg-slate-800/50 p-1 rounded-lg border border-slate-700">
             <input 
               type="text"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder={t('search')}
               className="bg-transparent border-none text-sm text-white px-2 py-1 focus:ring-0 w-full md:w-40 outline-none"
             />
             <div className="h-4 w-[1px] bg-slate-600 mx-1"></div>
             <button 
               onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
               className="text-slate-300 hover:text-white text-xs font-medium px-2 whitespace-nowrap"
             >
               {sortOrder === 'desc' ? `↓ ${t('sortNewest')}` : `↑ ${t('sortOldest')}`}
             </button>
          </div>

          <div className="flex gap-2 items-center mt-2">
            {/* CSV Controls */}
            <button onClick={() => setShowCsvHelp(!showCsvHelp)} className="text-slate-400 hover:text-white text-sm underline mr-2">{t('csvHelp')}</button>
            <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            <button onClick={() => importInputRef.current?.click()} className="bg-slate-700 text-white px-3 py-1.5 text-sm rounded hover:bg-slate-600">📥</button>
            {items.length > 0 && <button onClick={handleExportCSV} className="bg-slate-700 text-white px-3 py-1.5 text-sm rounded hover:bg-slate-600">📤</button>}
            
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-primary hover:bg-blue-600 text-white px-4 py-1.5 text-sm rounded-lg transition shadow-lg shadow-primary/30"
            >
              {isFormOpen ? t('cancel') : `+ ${t('writeDiary')}`}
            </button>
          </div>
           {showCsvHelp && (
             <div className="bg-slate-800 p-2 rounded text-xs text-slate-300 border border-slate-600 max-w-md absolute right-0 top-full z-10 mt-2 shadow-xl">
                {t('csvFormatDiary')}
                <div className="mt-2 text-orange-300 font-bold">
                  Note: Web apps cannot auto-write to local files. Please Export CSV to save changes.
                </div>
             </div>
           )}
        </div>
      </header>

      {/* Entry Form */}
      {isFormOpen && (
        <div className="bg-card border border-slate-700 rounded-xl p-6 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-dark border border-slate-600 rounded p-2 text-white"
              />
              <input 
                type="text" 
                placeholder={t('mood')}
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="bg-dark border border-slate-600 rounded p-2 text-white flex-1"
              />
            </div>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('diaryContent')}
              className="w-full h-40 bg-dark border border-slate-600 rounded p-4 text-white focus:border-primary outline-none"
              required
            />
            
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:text-white flex items-center gap-2 border border-primary/30 px-4 py-2 rounded hover:bg-primary/20 transition"
              >
                📷 {t('addImages')}
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
              />
              <span className="text-slate-400 text-sm">{images.length} images selected</span>
            </div>

            {/* Image Previews */}
            <div className="flex gap-2 overflow-x-auto py-2">
               {images.map((img, idx) => (
                 <div key={idx} className="relative shrink-0">
                   <img src={img} alt="preview" className="h-20 w-20 object-cover rounded border border-slate-600" />
                   <button 
                    type="button" 
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-xs text-white"
                   >✕</button>
                 </div>
               ))}
            </div>

            <button type="submit" className="w-full bg-primary text-white py-3 rounded font-bold hover:brightness-110 transition">
              {t('save')}
            </button>
          </form>
        </div>
      )}

      {/* Diary List (Masonry / Grid) */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {filteredItems.map((entry) => (
          <div 
            key={entry.id} 
            onClick={() => setSelectedEntry(entry)}
            className="break-inside-avoid bg-card p-5 rounded-xl border border-slate-700 hover:border-primary transition-all group relative cursor-pointer hover:-translate-y-1 duration-300 shadow-lg hover:shadow-primary/10"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-primary font-mono font-bold">{entry.date}</span>
              {entry.mood && <span className="bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-300 border border-slate-700">{entry.mood}</span>}
            </div>
            
            <p className="text-slate-300 whitespace-pre-wrap mb-4 text-sm leading-relaxed line-clamp-6">{entry.content}</p>
            
            {entry.images && entry.images.length > 0 && (
              <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
                {entry.images.slice(0, 2).map((img, i) => (
                  <div key={i} className="relative pt-[100%]">
                    <img src={img} alt="diary" className="absolute inset-0 w-full h-full object-cover" />
                    {i === 1 && entry.images.length > 2 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                        +{entry.images.length - 2}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-center text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition">
                {t('expandDiary')}
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
          <div className="text-center py-12 text-slate-500">
              No diary entries found.
          </div>
      )}

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedEntry(null)}
          ></div>
          
          {/* Content */}
          <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-fade-in border border-slate-700">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <div>
                 <h3 className="text-2xl font-bold text-white">{selectedEntry.date}</h3>
                 {selectedEntry.mood && <p className="text-primary mt-1">Mood: {selectedEntry.mood}</p>}
              </div>
              <div className="flex items-center gap-3">
                 <button 
                    onClick={() => handleDownloadEntry(selectedEntry)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-2"
                 >
                   💾 {t('downloadEntry')}
                 </button>
                 <button 
                    onClick={() => handleDelete(selectedEntry.id)}
                    className="text-slate-500 hover:text-red-500 p-2"
                    title={t('deleteUser')}
                 >
                   🗑️
                 </button>
                 <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-white text-xl px-2">✕</button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
               <p className="text-slate-200 whitespace-pre-wrap leading-loose text-lg mb-8">
                 {selectedEntry.content}
               </p>

               {selectedEntry.images && selectedEntry.images.length > 0 && (
                 <div className="space-y-8">
                    <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Attached Images</h4>
                      <span className="text-xs text-slate-600">({t('clickToZoom')})</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {selectedEntry.images.map((img, idx) => (
                        <div 
                          key={idx} 
                          className="relative group cursor-zoom-in"
                          onClick={() => setLightboxImage(img)}
                        >
                          <img src={img} alt={`diary-${idx}`} className="w-full h-48 object-cover rounded-lg shadow-lg border border-slate-700 hover:border-primary transition" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition rounded-lg flex items-center justify-center">
                             <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-3xl drop-shadow-lg">🔍</span>
                          </div>
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadImage(img, idx, selectedEntry.date);
                            }}
                            className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition flex items-center gap-2 backdrop-blur"
                          >
                             ⬇ {t('downloadImage')}
                          </button>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl"
            onClick={() => setLightboxImage(null)}
          >
            ✕
          </button>
          <img 
            src={lightboxImage} 
            alt="Fullscreen" 
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
          />
        </div>
      )}

    </div>
  );
};

export default DiarySection;
