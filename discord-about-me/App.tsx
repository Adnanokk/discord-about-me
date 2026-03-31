import React, { useState, useEffect } from 'react';
import RainBackground from './components/RainBackground';
import Window from './components/Window';
import LockScreen from './components/LockScreen';

type View = 'home' | 'age' | 'location' | 'usernames';
type Lang = 'en' | 'de';

const TRANSLATIONS = {
  en: {
    subtitle: 'Creative Mind & Nature Lover',
    homeTitle: 'Home',
    bio: [
      "My name is Adnan and I'm a chill guy. I love talking to people and I'm always available.",
      "I love nature and anime above all else – my absolute favorite anime is AOT (Attack on Titan).",
      "Use the menu at the top right to dive deeper into my profile."
    ],
    selectedWork: 'Selected Work',
    projects: [
      { title: 'Project about me', description: 'A personal project about my journey. Link coming soon.', tags: ['React', 'TypeScript'] },
      { title: 'Coming Soon', description: 'A new experiment is in the works. Stay tuned.', tags: ['Design', 'Creative'] }
    ],
    ageTitle: 'Age',
    ageSubtitle: 'Birthday & Mindset',
    ageBio: "I was born on November 15, 2009, but I'm very mature for my age. I don't care how old you are, as long as you know how to talk respectfully and have good manners.",
    locTitle: 'Origin',
    locSubtitle: 'Roots & Faith',
    locInfo: [
      "I live in NRW, Germany, but I was born in Syria. I am half Emirati and half Syrian.",
      "I am Muslim. Other people's origins don't really matter to me, as long as they don't have anything against my background or my faith. Respect comes first."
    ],
    userTitle: 'Usernames',
    userSubtitle: 'Gaming Identities'
  },
  de: {
    subtitle: 'Kreativer Geist & Natur-Liebhaber',
    homeTitle: 'Home',
    bio: [
      "Mein Name ist Adnan und ich bin ein chilliger Typ. Ich rede gerne mit Leuten und bin immer ansprechbar.",
      "Ich liebe die Natur und Anime über alles – mein absoluter Lieblings-Anime ist AOT (Attack on Titan).",
      "Verwende das Menü oben rechts, um tiefer in mein Profil einzutauchen."
    ],
    selectedWork: 'Ausgewählte Arbeit',
    projects: [
      { title: 'Project about me', description: 'Ein persönliches Projekt über meine Reise. Link folgt in Kürze.', tags: ['React', 'TypeScript'] },
      { title: 'Coming Soon', description: 'Ein neues Experiment ist in Arbeit. Bleib gespannt.', tags: ['Design', 'Creative'] }
    ],
    ageTitle: 'Alter',
    ageSubtitle: 'Geburtsdaten & Mindset',
    ageBio: "Ich bin zwar am 15.11.2009 geboren, bin aber sehr reif für mein Alter. Mir ist egal wie alt du bist, hauptsache du weißt wie du redest und bist respektvoll.",
    locTitle: 'Herkunft',
    locSubtitle: 'Wurzeln & Glaube',
    locInfo: [
      "Ich lebe in Deutschland (NRW), bin aber in Syrien geboren. Ich bin halb Arabische Emirate und halb Syrer.",
      "Ich bin Muslim. Die Herkunft von anderen Leuten ist mir eigentlich egal, solange sie nichts gegen meine Herkunft oder meinen Glauben haben. Respekt steht an erster Stelle."
    ],
    userTitle: 'Usernames',
    userSubtitle: 'Gaming Identitäten'
  }
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState<'gray' | 'warm'>('warm');
  const [language, setLanguage] = useState<Lang>('en');
  const [currentView, setCurrentView] = useState<View>('home');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const body = document.getElementById('body-bg');
    if (body) {
      body.style.backgroundColor = !isAuthenticated ? '#ffffff' : (theme === 'gray' ? '#09090b' : '#f5f5f0');
    }
  }, [theme, isAuthenticated]);

  const toggleTheme = () => setTheme(prev => prev === 'gray' ? 'warm' : 'gray');
  const handleLanguageToggle = (lang: Lang) => {
    setAnimating(true);
    setTimeout(() => {
      setLanguage(lang);
      setAnimating(false);
    }, 300);
  };

  const handleNavigate = (view: string) => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentView(view as View);
      setAnimating(false);
    }, 300);
  };

  const isGray = theme === 'gray';
  const t = TRANSLATIONS[language];

  if (!isAuthenticated) {
    return <LockScreen onUnlock={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <>
            <section>
              <h1 className={`text-5xl font-light mb-2 tracking-tight transition-colors duration-700 ${isGray ? 'text-white' : 'text-stone-900'}`}>@adnan_ok</h1>
              <p className={`font-medium tracking-widest uppercase text-xs mono mb-10 transition-colors duration-700 ${isGray ? 'text-zinc-500' : 'text-stone-500'}`}>{t.subtitle}</p>
              
              <div className={`space-y-4 text-lg font-light leading-relaxed transition-colors duration-700 ${isGray ? 'text-zinc-400' : 'text-stone-600'}`}>
                {t.bio.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>

            <section className="mt-16">
              <h2 className={`text-[10px] font-bold uppercase tracking-[0.4em] mb-8 mono transition-colors duration-700 ${isGray ? 'text-zinc-600' : 'text-stone-400'}`}>{t.selectedWork}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {t.projects.map(project => (
                  <div key={project.title} className={`p-6 border rounded-xl transition-all duration-300 group cursor-default ${
                    isGray 
                      ? 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900/40' 
                      : 'bg-white/40 border-stone-200 hover:border-stone-400 hover:bg-white'
                  }`}>
                    <h3 className={`font-medium mb-2 transition-colors duration-700 ${isGray ? 'text-zinc-100' : 'text-stone-900'}`}>{project.title}</h3>
                    <p className={`text-sm mb-4 leading-relaxed transition-colors duration-700 ${isGray ? 'text-zinc-500' : 'text-stone-500'}`}>{project.description}</p>
                    <div className="flex gap-2">
                      {project.tags.map(tag => (
                        <span key={tag} className={`text-[9px] px-2 py-0.5 rounded-full mono transition-all duration-700 ${
                          isGray 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-500' 
                            : 'bg-stone-100 border-stone-200 text-stone-400'
                        }`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        );
      case 'age':
        return (
          <section className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className={`text-5xl font-light mb-2 tracking-tight transition-colors duration-700 ${isGray ? 'text-white' : 'text-stone-900'}`}>{t.ageTitle}</h1>
            <p className={`font-medium tracking-widest uppercase text-xs mono mb-10 transition-colors duration-700 ${isGray ? 'text-zinc-500' : 'text-stone-500'}`}>{t.ageSubtitle}</p>
            <div className={`text-4xl font-light mono transition-colors duration-700 ${isGray ? 'text-zinc-300' : 'text-stone-700'}`}>
              15.11.2009
            </div>
            <div className={`mt-10 max-w-xl text-lg font-light leading-relaxed ${isGray ? 'text-zinc-500' : 'text-stone-500'}`}>
              {t.ageBio}
            </div>
          </section>
        );
      case 'location':
        return (
          <section className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className={`text-5xl font-light mb-2 tracking-tight transition-colors duration-700 ${isGray ? 'text-white' : 'text-stone-900'}`}>{t.locTitle}</h1>
            <p className={`font-medium tracking-widest uppercase text-xs mono mb-10 transition-colors duration-700 ${isGray ? 'text-zinc-500' : 'text-stone-500'}`}>{t.locSubtitle}</p>
            <div className={`text-4xl font-light transition-colors duration-700 ${isGray ? 'text-zinc-300' : 'text-stone-700'}`}>
              {language === 'en' ? 'Germany (NRW)' : 'Deutschland (NRW)'}
            </div>
            <div className={`mt-10 space-y-6 max-w-xl text-lg font-light leading-relaxed ${isGray ? 'text-zinc-500' : 'text-stone-500'}`}>
              {t.locInfo.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        );
      case 'usernames':
        return (
          <section className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h1 className={`text-5xl font-light mb-2 tracking-tight transition-colors duration-700 ${isGray ? 'text-white' : 'text-stone-900'}`}>{t.userTitle}</h1>
            <p className={`font-medium tracking-widest uppercase text-xs mono mb-10 transition-colors duration-700 ${isGray ? 'text-zinc-500' : 'text-stone-500'}`}>{t.userSubtitle}</p>
            <div className="space-y-8">
              {[
                { platform: 'Roblox', id: 'piggy12jad' },
                { platform: 'Fortnite', id: 'Adnxn_ok' },
                { platform: 'Minecraft', id: 'adnan_ok' },
                { platform: 'Discord', id: '@adnan_ok' }
              ].map((game, i) => (
                <div key={i} className={`flex items-center gap-6 text-2xl font-mono transition-colors duration-700 ${isGray ? 'text-zinc-300' : 'text-stone-700'}`}>
                  <span className="text-stone-400 text-xs uppercase tracking-widest w-24">{game.platform}</span>
                  <span className="font-medium">{game.id}</span>
                </div>
              ))}
            </div>
          </section>
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <RainBackground theme={theme} />

      <Window 
        title="profile.vsc" 
        theme={theme} 
        language={language}
        onThemeToggle={toggleTheme}
        onLanguageToggle={handleLanguageToggle}
        onNavigate={handleNavigate}
      >
        <div className={`transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}>
          <div className="max-w-3xl mx-auto py-10">
            {renderContent()}
          </div>
        </div>
      </Window>

      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] mono uppercase tracking-[0.5em] hidden md:block opacity-30 transition-colors duration-700 ${isGray ? 'text-zinc-500' : 'text-stone-400'}`}>
        Adnan • @adnan_ok • 2024
      </div>
    </div>
  );
};

export default App;