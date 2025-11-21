
import React, { useState } from 'react';
import { View, Language } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, toggleSidebar }) => {
  const { t, language, setLanguage } = useLanguage();
  const { users, currentUser, switchUser, addUser, themeColor, setThemeColor, deleteUser } = useUser();
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  
  // Login Modal State
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState(false);

  const menuItems = [
    { id: View.DASHBOARD, label: t('dashboard'), icon: '🏠' },
    { id: View.DIARY, label: t('diary'), icon: '📔' },
    { id: View.MESSAGES, label: t('messages'), icon: '💬' },
    { id: View.MUSIC, label: t('music'), icon: '🎵' },
    { id: View.ENTERTAINMENT, label: t('media'), icon: '🎬' },
    { id: View.TRAVEL, label: t('travel'), icon: '✈️' },
    { id: View.JAPANESE, label: t('japanese'), icon: 'あ' },
    { id: View.EXPERIENCE, label: t('experience'), icon: '💼' },
  ];

  const themeColors = [
    { name: 'Blue', rgb: '59, 130, 246', hex: '#3b82f6' },
    { name: 'Purple', rgb: '147, 51, 234', hex: '#9333ea' },
    { name: 'Green', rgb: '22, 163, 74', hex: '#16a34a' },
    { name: 'Rose', rgb: '225, 29, 72', hex: '#e11d48' },
    { name: 'Amber', rgb: '217, 119, 6', hex: '#d97706' },
  ];

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user?.pin) {
      setTargetUserId(userId);
      setLoginPin('');
      setLoginError(false);
    } else {
      switchUser(userId);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === targetUserId);
    if (user && user.pin === loginPin) {
      switchUser(user.id);
      setTargetUserId(null); // Close modal
      setLoginPin('');
    } else {
      setLoginError(true);
    }
  };

  const handleAddUser = () => {
    if(newUserName) {
      addUser(newUserName, newUserPin);
      setNewUserName('');
      setNewUserPin('');
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* PIN Verification Modal */}
      {targetUserId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-slate-600 p-6 rounded-xl w-full max-w-xs shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 text-center">{t('pinRequired')}</h3>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input 
                type="password" 
                className={`w-full bg-dark border ${loginError ? 'border-red-500' : 'border-slate-600'} rounded-lg p-3 text-center text-2xl tracking-widest text-white`}
                maxLength={4}
                placeholder="••••"
                value={loginPin}
                onChange={(e) => {
                  setLoginPin(e.target.value);
                  setLoginError(false);
                }}
                autoFocus
              />
              {loginError && <p className="text-red-400 text-xs text-center">{t('wrongPin')}</p>}
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setTargetUserId(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary hover:bg-blue-600 text-white py-2 rounded-lg"
                >
                  {t('login')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-slate-700 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">My<span className="text-primary">Hub</span></h1>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Language Switcher */}
        <div className="px-6 py-4 flex gap-2">
          <button 
            onClick={() => setLanguage(Language.ZH_TW)}
            className={`px-3 py-1 text-xs rounded-full border ${language === Language.ZH_TW ? 'bg-primary text-white border-primary' : 'text-slate-400 border-slate-600 hover:border-slate-400'}`}
          >
            繁體中文
          </button>
          <button 
            onClick={() => setLanguage(Language.JA_JP)}
            className={`px-3 py-1 text-xs rounded-full border ${language === Language.JA_JP ? 'bg-primary text-white border-primary' : 'text-slate-400 border-slate-600 hover:border-slate-400'}`}
          >
            日本語
          </button>
        </div>

        <nav className="mt-2 px-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                currentView === item.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User & Settings */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          {/* Settings Toggle */}
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center justify-between w-full text-slate-300 hover:text-white mb-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-white/20 flex items-center justify-center text-white font-bold text-xs relative">
                {currentUser.name.substring(0,2).toUpperCase()}
                {currentUser.pin && <div className="absolute -bottom-1 -right-1 text-[8px]">🔒</div>}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{currentUser.name}</p>
              </div>
            </div>
            <span>{isSettingsOpen ? '▼' : '⚙️'}</span>
          </button>

          {isSettingsOpen && (
            <div className="space-y-4 pt-2 border-t border-slate-700 animate-fade-in">
              
              {/* Theme Picker */}
              <div>
                <p className="text-xs text-slate-500 mb-2 uppercase font-bold">{t('themeColor')}</p>
                <div className="flex gap-2 flex-wrap">
                  {themeColors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setThemeColor(c.rgb)}
                      className={`w-6 h-6 rounded-full border-2 ${themeColor === c.rgb ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* User Switcher */}
              <div>
                 <p className="text-xs text-slate-500 mb-2 uppercase font-bold">{t('switchUser')}</p>
                 <div className="space-y-2 mb-3">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between text-sm">
                         <button 
                            onClick={() => handleUserClick(u.id)}
                            className={`flex-1 text-left flex items-center gap-2 ${currentUser.id === u.id ? 'text-primary font-bold' : 'text-slate-400 hover:text-white'}`}
                         >
                           {u.name}
                           {u.pin && <span className="text-[10px] opacity-50">🔒</span>}
                         </button>
                         {users.length > 1 && (
                           <button onClick={() => deleteUser(u.id)} className="text-slate-600 hover:text-red-500 px-1">×</button>
                         )}
                      </div>
                    ))}
                 </div>
                 
                 {/* Add User Form */}
                 <div className="flex flex-col gap-2">
                   <input 
                    className="w-full bg-darker rounded px-2 py-1 text-xs text-white border border-slate-600"
                    placeholder={t('enterUserName')}
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                   />
                   <div className="flex gap-2">
                    <input 
                      className="w-full bg-darker rounded px-2 py-1 text-xs text-white border border-slate-600"
                      placeholder={t('pinPlaceholder')}
                      value={newUserPin}
                      onChange={(e) => setNewUserPin(e.target.value)}
                      maxLength={4}
                      type="password"
                    />
                     <button 
                      onClick={handleAddUser}
                      className="bg-primary text-white px-3 rounded text-xs font-bold"
                     >
                       +
                     </button>
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
