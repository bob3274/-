
import React, { useState, useEffect, useRef } from 'react';
import { JapaneseWord } from '../types';
import { explainJapaneseWord, playJapaneseText } from '../services/gemini';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { generateJapaneseCSV, parseJapaneseCSV, downloadCSV } from '../utils/csvHelper';

const JapaneseSection: React.FC = () => {
  const { t } = useLanguage();
  const { getUserStorageKey } = useUser();
  const [items, setItems] = useState<JapaneseWord[]>([]);
  const [inputWord, setInputWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = getUserStorageKey('japanese');

  // Load from localStorage (or default) on mount or user change
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      if (items.length === 0) {
        fetch('/japanese_db.csv')
            .then(res => {
            if (res.ok) return res.text();
            throw new Error('No default DB');
            })
            .then(text => {
            const parsed = parseJapaneseCSV(text);
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
     localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord) return;

    setLoading(true);
    setError(null);

    try {
      const result = await explainJapaneseWord(inputWord);
      
      const newItem: JapaneseWord = {
        id: Date.now().toString(),
        word: result.word,
        reading: result.reading,
        meaning: result.meaning,
        meaningJP: result.meaningJP,
        exampleSentence: result.exampleSentence,
        exampleTranslation: result.exampleTranslation,
        addedAt: Date.now(),
      };

      setItems([newItem, ...items]);
      setInputWord('');
    } catch (err) {
      setError('Failed to generate definition. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // --- CSV Handlers ---
  const handleExportCSV = () => {
    const csvContent = generateJapaneseCSV(items);
    downloadCSV(csvContent, `japanese_db_${new Date().toISOString().slice(0,10)}.csv`);
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
        const newItems = parseJapaneseCSV(text);
        
        // Merge: Avoid duplicates by Word
        setItems(prev => {
          const existingWords = new Set(prev.map(i => i.word));
          const filteredNew = newItems.filter(i => !existingWords.has(i.word));
          return [...filteredNew, ...prev];
        });
        alert(t('importSuccess'));
      } catch (err) {
        console.error(err);
        alert(t('importError'));
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = ''; 
  };
  // --------------------

  const handlePlay = async (text: string, id: string) => {
    if (playingAudioId) return; 
    setPlayingAudioId(id);
    
    try {
      await playJapaneseText(text);
    } catch (e) {
      console.error("Playback failed:", e);
      setError("Could not play audio. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setPlayingAudioId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-700 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            {t('japaneseVocab')}
            <span className="text-sm font-normal bg-primary/20 text-primary px-3 py-1 rounded-full">AI Powered</span>
          </h2>
          <p className="text-slate-400 mt-1">{t('japaneseSubtitle')}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-2">
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
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                📥 {t('importCsv')}
              </button>
              {items.length > 0 && (
                <button 
                  onClick={handleExportCSV}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  📤 {t('exportCsv')}
                </button>
              )}
           </div>
           {showCsvHelp && (
             <div className="bg-slate-800 p-2 rounded text-xs text-slate-300 border border-slate-600 max-w-md">
                {t('csvFormatJapanese')}
             </div>
           )}
        </div>
      </header>

      {/* AI Input Area */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg">
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm text-slate-400 mb-2">{t('enterWord')}</label>
            <div className="relative">
              <input
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                disabled={loading}
                className="w-full bg-darker border border-slate-600 rounded-lg p-4 text-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition disabled:opacity-50"
                placeholder="e.g. 努力"
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !inputWord}
            className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-medium py-4 px-8 rounded-lg transition-colors shadow-lg shadow-blue-500/20 w-full md:w-auto whitespace-nowrap"
          >
            {loading ? t('generating') : t('askAi')}
          </button>
        </form>
        {error && <p className="text-red-400 mt-3 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
      </div>

      {/* Vocabulary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-card rounded-xl border border-slate-700 p-6 hover:border-primary/30 transition shadow-sm relative group">
            <button 
              onClick={() => handleDelete(item.id)}
              className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
            
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{item.reading}</p>
                  <h3 className="text-3xl font-bold text-white">{item.word}</h3>
                </div>
                <button 
                  onClick={() => handlePlay(item.word, item.id + '_w')}
                  disabled={!!playingAudioId}
                  className={`p-2 rounded-full transition flex items-center justify-center w-10 h-10 ${playingAudioId === item.id + '_w' ? 'bg-primary/20' : 'text-primary hover:text-white hover:bg-primary'}`}
                  title={t('playAudio')}
                >
                  {playingAudioId === item.id + '_w' ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : '🔊'}
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs text-primary uppercase font-bold tracking-wider">CH</span>
                  <p className="text-slate-200 font-medium text-sm">{item.meaning}</p>
                </div>
                {item.meaningJP && (
                   <div className="flex items-baseline gap-2">
                   <span className="text-xs text-purple-400 uppercase font-bold tracking-wider">JP</span>
                   <p className="text-slate-300 font-medium text-sm">{item.meaningJP}</p>
                 </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                   <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t('example')}</span>
                   <button 
                      onClick={() => handlePlay(item.exampleSentence, item.id + '_s')}
                      disabled={!!playingAudioId}
                      className="text-xs text-primary hover:underline flex items-center gap-1 p-1 rounded hover:bg-primary/10"
                   >
                      {playingAudioId === item.id + '_s' ? (
                        <span className="animate-pulse flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"/> ...
                        </span>
                      ) : (
                        <>🔊 {t('playAudio')}</>
                      )}
                   </button>
                </div>
                <p className="text-slate-300 mt-1 text-sm leading-relaxed border-l-2 border-slate-600 pl-2">{item.exampleSentence}</p>
                <p className="text-slate-500 text-xs mt-1 pl-2">{item.exampleTranslation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JapaneseSection;
