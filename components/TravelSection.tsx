
import React, { useState, useEffect, useRef } from 'react';
import { TravelSpot, TravelStatus } from '../types';
import { searchTravelSpot, TravelSearchResult, planTravelItinerary } from '../services/gemini';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import ReactMarkdown from 'react-markdown';
import { generateTravelCSV, parseTravelCSV, downloadCSV } from '../utils/csvHelper';

const TravelSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { getUserStorageKey } = useUser();
  const [items, setItems] = useState<TravelSpot[]>([]);
  const [activeTab, setActiveTab] = useState<TravelStatus>(TravelStatus.WANT_TO_GO);
  
  // Search State
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<TravelSearchResult | null>(null);
  
  // Planning State
  const [isPlanning, setIsPlanning] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  // File Input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageKey = getUserStorageKey('travel');

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      if (items.length === 0) {
        // Auto-check for default file
        fetch('/travel_db.csv')
            .then(res => {
            if (res.ok) return res.text();
            throw new Error('No default DB');
            })
            .then(text => {
            const parsed = parseTravelCSV(text);
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

  const filteredItems = items.filter(item => item.status === activeTab);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsSearching(true);
    setSearchResult(null);
    try {
      const result = await searchTravelSpot(query);
      setSearchResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSpot = () => {
    if (!searchResult) return;
    
    const newItem: TravelSpot = {
      id: Date.now().toString(),
      name: searchResult.name,
      address: searchResult.address,
      googleMapsUri: searchResult.uri,
      status: TravelStatus.WANT_TO_GO, 
      addedAt: Date.now(),
    };

    setItems([newItem, ...items]);
    setSearchResult(null);
    setQuery('');
    setActiveTab(TravelStatus.WANT_TO_GO);
  };

  const handleMoveStatus = (id: string, newStatus: TravelStatus) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handlePlanItinerary = async () => {
    const wantToGoSpots = items.filter(i => i.status === TravelStatus.WANT_TO_GO);
    if (wantToGoSpots.length === 0) return;

    setIsPlanning(true);
    setItinerary(null);
    try {
      const result = await planTravelItinerary(wantToGoSpots, language);
      setItinerary(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPlanning(false);
    }
  };

  // --- CSV Handlers ---
  const handleExportCSV = () => {
    const csvContent = generateTravelCSV(items);
    downloadCSV(csvContent, `travel_db_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const newItems = parseTravelCSV(text);
        
        // Merge: Avoid duplicates by Name
        setItems(prev => {
          const existingNames = new Set(prev.map(i => i.name));
          const filteredNew = newItems.filter(i => !existingNames.has(i.name));
          return [...filteredNew, ...prev];
        });
        alert(t('importSuccess'));
      } catch (err) {
        console.error(err);
        alert(t('importError'));
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };
  // --------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{t('travelLog')}</h2>
          <p className="text-slate-400 mt-1">{t('travelSubtitle')}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-4">
            {/* Buttons */}
             <div className="flex bg-card p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => { setActiveTab(TravelStatus.WANT_TO_GO); setItinerary(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === TravelStatus.WANT_TO_GO 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('wantToGo')}
              </button>
              <button
                onClick={() => { setActiveTab(TravelStatus.VISITED); setItinerary(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === TravelStatus.VISITED 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('visited')}
              </button>
            </div>

            {/* CSV Actions */}
            <div className="flex gap-2 items-center">
              <button onClick={() => setShowCsvHelp(!showCsvHelp)} className="text-slate-400 hover:text-white text-sm underline mr-2">{t('csvHelp')}</button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              <button 
                onClick={handleImportClick}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                title={t('importCsv')}
              >
                📥
              </button>
              {items.length > 0 && (
                <button 
                  onClick={handleExportCSV}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
                  title={t('exportCsv')}
                >
                  📤
                </button>
              )}
            </div>
          </div>
          {showCsvHelp && (
             <div className="bg-slate-800 p-2 rounded text-xs text-slate-300 border border-slate-600 max-w-md">
                {t('csvFormatTravel')}
             </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Search & Add */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-xl border border-slate-700 sticky top-24">
            <h3 className="text-lg font-semibold text-white mb-4">{t('findLocation')}</h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t('placeName')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-dark border border-slate-600 rounded-lg p-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                    placeholder="e.g. Tokyo Tower"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !query}
                    className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white px-4 rounded-lg transition"
                  >
                    {isSearching ? '...' : '🔍'}
                  </button>
                </div>
              </div>
            </form>

            {/* Search Result Preview */}
            {searchResult && (
              <div className="mt-6 animate-fade-in border-t border-slate-700 pt-4">
                <h4 className="font-bold text-white text-lg mb-1">{searchResult.name}</h4>
                <p className="text-sm text-slate-400 mb-3">{searchResult.address}</p>
                
                {/* Map Iframe Preview */}
                <div className="w-full h-48 bg-slate-800 rounded-lg overflow-hidden mb-4 border border-slate-600">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(searchResult.name + ' ' + searchResult.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                  ></iframe>
                </div>

                <button
                  onClick={handleAddSpot}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg"
                >
                  {t('confirmAdd')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: List & Itinerary */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Itinerary Generator Button (Only on Want to Go tab) */}
          {activeTab === TravelStatus.WANT_TO_GO && items.filter(i => i.status === TravelStatus.WANT_TO_GO).length > 0 && (
             <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                 <h3 className="text-white font-bold text-lg">✨ {t('planItinerary')}</h3>
                 <p className="text-slate-300 text-sm">{t('planFor')}</p>
               </div>
               <button 
                onClick={handlePlanItinerary}
                disabled={isPlanning}
                className="bg-white text-purple-900 hover:bg-slate-200 font-bold px-6 py-2 rounded-full transition shadow-lg disabled:opacity-50"
               >
                 {isPlanning ? t('planning') : 'Generate Plan'}
               </button>
             </div>
          )}

          {/* Itinerary Result */}
          {itinerary && (
            <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-600 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-white">🗺️ {t('itineraryResult')}</h3>
                 <button onClick={() => setItinerary(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
                <ReactMarkdown>{itinerary}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Spots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-card p-5 rounded-xl border border-slate-700 hover:border-slate-500 transition group relative flex flex-col justify-between h-full">
                 <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-3 right-3 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>

                 <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📍</span>
                      <h4 className="text-white font-bold text-lg leading-tight">{item.name}</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{item.address}</p>
                 </div>
                 
                 <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-800">
                    <a 
                      href={item.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {t('openMap')} ↗
                    </a>
                    
                    {item.status === TravelStatus.WANT_TO_GO ? (
                      <button
                        onClick={() => handleMoveStatus(item.id, TravelStatus.VISITED)}
                        className="text-xs bg-slate-700 hover:bg-green-600 text-white px-3 py-1 rounded-full transition"
                      >
                        ✓ {t('markAsVisited')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMoveStatus(item.id, TravelStatus.WANT_TO_GO)}
                        className="text-xs bg-slate-700 hover:bg-primary text-white px-3 py-1 rounded-full transition"
                      >
                        ↺ {t('markAsWantToGo')}
                      </button>
                    )}
                 </div>
              </div>
            ))}
          </div>
          
          {filteredItems.length === 0 && (
             <div className="text-center py-12 text-slate-500 bg-card/50 rounded-xl border border-dashed border-slate-700">
               <p>No locations in "{activeTab === TravelStatus.WANT_TO_GO ? t('wantToGo') : t('visited')}".</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelSection;
