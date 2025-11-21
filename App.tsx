
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { View } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';

// Sections
import MusicSection from './components/MusicSection';
import EntertainmentSection from './components/EntertainmentSection';
import TravelSection from './components/TravelSection';
import JapaneseSection from './components/JapaneseSection';
import ExperienceSection from './components/ExperienceSection';
import DiarySection from './components/DiarySection';
import MessageBoardSection from './components/MessageBoardSection';

const Dashboard: React.FC<{ changeView: (v: View) => void }> = ({ changeView }) => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-primary to-purple-600 p-8 rounded-2xl shadow-2xl text-white">
        <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
        <p className="text-lg opacity-90">Your personal hub for everything that matters. Track your progress, plan your trips, and enjoy your media.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => changeView(View.DIARY)}
          className="bg-card p-6 rounded-xl border border-slate-700 hover:border-primary cursor-pointer transition group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📔</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('diary')}</h3>
          <p className="text-slate-400">{t('diarySubtitle')}</p>
        </div>

        <div 
          onClick={() => changeView(View.MESSAGES)}
          className="bg-card p-6 rounded-xl border border-slate-700 hover:border-primary cursor-pointer transition group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💬</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('messageBoard')}</h3>
          <p className="text-slate-400">{t('messageSubtitle')}</p>
        </div>

        <div 
          onClick={() => changeView(View.MUSIC)}
          className="bg-card p-6 rounded-xl border border-slate-700 hover:border-primary cursor-pointer transition group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🎵</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('musicLibrary')}</h3>
          <p className="text-slate-400">{t('musicSubtitle')}</p>
        </div>

        <div 
          onClick={() => changeView(View.JAPANESE)}
          className="bg-card p-6 rounded-xl border border-slate-700 hover:border-primary cursor-pointer transition group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">あ</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('japaneseVocab')}</h3>
          <p className="text-slate-400">{t('japaneseSubtitle')}</p>
        </div>

        <div 
          onClick={() => changeView(View.TRAVEL)}
          className="bg-card p-6 rounded-xl border border-slate-700 hover:border-primary cursor-pointer transition group"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">✈️</div>
          <h3 className="text-xl font-bold text-white mb-2">{t('travelLog')}</h3>
          <p className="text-slate-400">{t('travelSubtitle')}</p>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (currentView) {
      case View.MUSIC: return <MusicSection />;
      case View.ENTERTAINMENT: return <EntertainmentSection />;
      case View.TRAVEL: return <TravelSection />;
      case View.JAPANESE: return <JapaneseSection />;
      case View.EXPERIENCE: return <ExperienceSection />;
      case View.DIARY: return <DiarySection />;
      case View.MESSAGES: return <MessageBoardSection />;
      default: return <Dashboard changeView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-darker text-slate-200 flex">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 lg:ml-64 min-h-screen transition-all duration-300">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-slate-800 flex items-center bg-darker sticky top-0 z-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-white hover:bg-slate-800 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="ml-4 font-bold text-lg text-white">MyHub</span>
        </div>

        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </UserProvider>
  );
};

export default App;