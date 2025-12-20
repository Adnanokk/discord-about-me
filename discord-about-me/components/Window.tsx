
import React, { ReactNode, useState } from 'react';
import StarTrail from './StarTrail';

interface WindowProps {
  children: ReactNode;
  title: string;
  theme: 'gray' | 'warm';
  language: 'en' | 'de';
  onThemeToggle: () => void;
  onLanguageToggle: (lang: 'en' | 'de') => void;
  onNavigate: (view: string) => void;
}

const Window: React.FC<WindowProps> = ({ 
  children, title, theme, language, onThemeToggle, onLanguageToggle, onNavigate 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isGray = theme === 'gray';

  const menuItems = language === 'en' ? [
    { label: 'Home', view: 'home' },
    { label: 'Age', view: 'age' },
    { label: 'Origin', view: 'location' },
    { label: 'Usernames', view: 'usernames' },
  ] : [
    { label: 'Home', view: 'home' },
    { label: 'Alter', view: 'age' },
    { label: 'Herkunft', view: 'location' },
    { label: 'Usernames', view: 'usernames' },
  ];

  return (
    <div className={`relative w-full max-w-4xl h-[85vh] transition-all duration-700 rounded-xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 ${
      isGray 
        ? 'bg-zinc-900/90 border-zinc-700 text-zinc-300' 
        : 'bg-stone-50/95 border-stone-300 text-stone-800'
    }`}>
      <StarTrail />

      {/* Title Bar */}
      <div className={`h-10 border-b flex items-center justify-between px-4 select-none transition-colors duration-700 ${
        isGray ? 'bg-zinc-950/80 border-zinc-700' : 'bg-stone-200/50 border-stone-300'
      }`}>
        <div className="flex gap-2 items-center">
          <div className="w-3 h-3 rounded-full bg-red-400/40 hover:bg-red-400 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/40 hover:bg-yellow-400 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-green-400/40 hover:bg-green-400 transition-colors cursor-pointer" />
        </div>
        
        <div className={`text-[9px] font-bold mono uppercase tracking-[0.4em] transition-colors duration-700 ${
          isGray ? 'text-zinc-600' : 'text-stone-400'
        }`}>
          {title}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className={`flex text-[8px] mono border rounded px-1.5 py-0.5 transition-colors ${isGray ? 'border-zinc-800 text-zinc-500' : 'border-stone-300 text-stone-400'}`}>
            <button 
              onClick={() => onLanguageToggle('en')} 
              className={`px-1 hover:text-white transition-colors ${language === 'en' ? (isGray ? 'text-zinc-100' : 'text-stone-900 font-bold') : ''}`}
            >
              EN
            </button>
            <span className="opacity-30">/</span>
            <button 
              onClick={() => onLanguageToggle('de')} 
              className={`px-1 hover:text-white transition-colors ${language === 'de' ? (isGray ? 'text-zinc-100' : 'text-stone-900 font-bold') : ''}`}
            >
              DE
            </button>
          </div>

          <div className="flex gap-1 items-center bg-black/10 rounded-full px-1 py-0.5 border border-white/5">
            <button 
              onClick={onThemeToggle}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                isGray ? 'bg-zinc-100 shadow-md' : 'bg-transparent'
              }`}
            >
              <div className="w-1 h-1 rounded-full bg-zinc-800 opacity-80" />
            </button>
            <button 
              onClick={onThemeToggle}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                !isGray ? 'bg-stone-800 shadow-md' : 'bg-transparent'
              }`}
            >
              <div className="w-1 h-1 rounded-full bg-stone-100 opacity-80" />
            </button>
          </div>
        </div>
      </div>

      {/* Internal Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 md:p-12 relative">
        <div className="absolute top-8 right-8 z-50">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-300 group ${
              isGray ? 'hover:bg-zinc-800/50' : 'hover:bg-stone-200/50'
            }`}
          >
            <div className={`w-6 h-0.5 transition-all duration-300 ${isGray ? 'bg-zinc-400 group-hover:bg-zinc-100' : 'bg-stone-500 group-hover:bg-stone-900'} ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <div className={`w-6 h-0.5 transition-all duration-300 ${isGray ? 'bg-zinc-400 group-hover:bg-zinc-100' : 'bg-stone-500 group-hover:bg-stone-900'} ${isMenuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-6 h-0.5 transition-all duration-300 ${isGray ? 'bg-zinc-400 group-hover:bg-zinc-100' : 'bg-stone-500 group-hover:bg-stone-900'} ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className={`absolute top-14 right-0 w-48 rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-top-4 duration-300 ${
              isGray ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white/95 border-stone-200'
            }`}>
              <div className="p-2 flex flex-col">
                {menuItems.map((item, idx) => (
                  <button
                    key={item.view}
                    onClick={() => {
                      onNavigate(item.view);
                      setIsMenuOpen(false);
                    }}
                    className={`text-left px-4 py-3 rounded-lg text-xs mono uppercase tracking-widest transition-all duration-200 ${
                      isGray 
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' 
                        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Window;
