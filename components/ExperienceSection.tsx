
import React, { useState, useEffect, useRef } from 'react';
import { ExperienceItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { generateExperienceCSV, parseExperienceCSV, downloadCSV } from '../utils/csvHelper';

const ExperienceSection: React.FC = () => {
  const { t } = useLanguage();
  const { getUserStorageKey } = useUser();
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [period, setPeriod] = useState('');
  const [desc, setDesc] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageKey = getUserStorageKey('experience');

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
        // Auto-check for 'experience_db.csv'
        if (items.length === 0) {
            fetch('/experience_db.csv')
              .then(res => {
                if (res.ok) return res.text();
                throw new Error('No default DB');
              })
              .then(text => {
                const parsed = parseExperienceCSV(text);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ExperienceItem = {
      id: Date.now().toString(),
      title,
      company,
      period,
      description: desc,
      tags: tagsInput.split(',').map(t => t.trim()).filter(t => t),
    };
    setItems([newItem, ...items]);
    setIsFormOpen(false);
    // Reset
    setTitle(''); setCompany(''); setPeriod(''); setDesc(''); setTagsInput('');
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // CSV Handlers
  const handleExportCSV = () => {
    const csvContent = generateExperienceCSV(items);
    downloadCSV(csvContent, `experience_db_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const newItems = parseExperienceCSV(evt.target?.result as string);
        setItems(prev => [...newItems, ...prev]);
        alert(t('importSuccess'));
      } catch(err) { alert(t('importError')); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{t('myExperience')}</h2>
          <p className="text-slate-400 mt-1">{t('expSubtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowCsvHelp(!showCsvHelp)} className="text-slate-400 hover:text-white text-sm underline mr-2">{t('csvHelp')}</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-slate-700 text-white px-3 rounded hover:bg-slate-600">📥</button>
            {items.length > 0 && <button onClick={handleExportCSV} className="bg-slate-700 text-white px-3 rounded hover:bg-slate-600">📤</button>}
            
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            >
              {isFormOpen ? t('cancel') : `+ ${t('addExp')}`}
            </button>
          </div>
          {showCsvHelp && (
             <div className="bg-slate-800 p-2 rounded text-xs text-slate-300 border border-slate-600 max-w-md absolute right-8 z-10 mt-10">
                {t('csvFormatExp')}
             </div>
          )}
        </div>
      </header>

      {isFormOpen && (
        <div className="bg-card border border-slate-700 rounded-xl p-6 animate-fade-in">
          <h3 className="text-xl font-semibold text-white mb-4">{t('addExp')}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder={t('jobTitle')}
              className="bg-dark border border-slate-600 rounded p-3 text-white"
              value={title} onChange={e => setTitle(e.target.value)} required 
            />
            <input 
              placeholder={t('company')}
              className="bg-dark border border-slate-600 rounded p-3 text-white"
              value={company} onChange={e => setCompany(e.target.value)} required 
            />
            <input 
              placeholder={t('period') + " (e.g. 2020 - 2021)"}
              className="bg-dark border border-slate-600 rounded p-3 text-white"
              value={period} onChange={e => setPeriod(e.target.value)} required 
            />
            <input 
              placeholder={t('tags')}
              className="bg-dark border border-slate-600 rounded p-3 text-white"
              value={tagsInput} onChange={e => setTagsInput(e.target.value)} 
            />
            <textarea 
              placeholder={t('description')}
              className="bg-dark border border-slate-600 rounded p-3 text-white md:col-span-2 h-32"
              value={desc} onChange={e => setDesc(e.target.value)} required 
            />
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-3 rounded md:col-span-2 font-bold">{t('save')}</button>
          </form>
        </div>
      )}

      <div className="relative border-l-2 border-slate-700 ml-4 md:ml-8 space-y-12 py-4">
        {items.map((exp) => (
          <div key={exp.id} className="relative pl-8 md:pl-12 group">
            {/* Dot */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-darker group-hover:scale-125 transition duration-300"></div>
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
              <div>
                <h3 className="text-2xl font-bold text-white">{exp.title}</h3>
                <div className="text-lg text-primary font-medium">{exp.company}</div>
              </div>
              <div className="flex items-center gap-4 mt-1 md:mt-0">
                <span className="text-slate-400 bg-slate-800 px-3 py-1 rounded-full text-sm font-mono">
                  {exp.period}
                </span>
                <button onClick={() => handleDelete(exp.id)} className="text-slate-600 hover:text-red-500">✕</button>
              </div>
            </div>
            
            <div className="bg-card/50 p-6 rounded-xl border border-slate-800 hover:border-slate-600 transition mt-4">
              <p className="text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">{exp.description}</p>
              <div className="flex flex-wrap gap-2">
                {exp.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceSection;
