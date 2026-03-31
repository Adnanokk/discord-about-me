import React, { useState, useEffect } from 'react';

interface LockScreenProps {
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwords, setPasswords] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('site_passwords');
    if (saved) {
      setPasswords(JSON.parse(saved));
    } else {
      generatePasswords();
    }
  }, []);

  const generatePasswords = () => {
    const newPasses = Array.from({ length: 10 }, () => 
      Math.random().toString(36).slice(-8)
    );
    setPasswords(newPasses);
    localStorage.setItem('site_passwords', JSON.stringify(newPasses));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.includes(input)) {
      const newPasses = passwords.filter(p => p !== input);
      setPasswords(newPasses);
      localStorage.setItem('site_passwords', JSON.stringify(newPasses));
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleHiddenClick = () => {
    const master = prompt('Master-Passwort:');
    if (master && btoa(master) === 'YWRuYW5fYm9zcw==') {
      setIsAdmin(true);
    }
  };

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-mono text-stone-800">
        <h2 className="text-2xl font-light mb-8 tracking-widest uppercase">Admin Panel</h2>
        <div className="bg-stone-50 border border-stone-200 p-8 rounded-xl max-w-md w-full">
          <p className="text-xs text-stone-400 mb-4 uppercase tracking-widest">Aktive Passwörter:</p>
          <ul className="space-y-2 mb-8 text-sm">
            {passwords.map((p, i) => (
              <li key={i} className="bg-white px-3 py-2 border border-stone-100 rounded">{p}</li>
            ))}
          </ul>
          <div className="flex gap-4">
            <button onClick={generatePasswords} className="flex-1 bg-stone-900 text-white text-xs uppercase tracking-widest py-3 rounded hover:bg-stone-800 transition">Neu generieren</button>
            <button onClick={() => setIsAdmin(false)} className="flex-1 border border-stone-200 text-stone-600 text-xs uppercase tracking-widest py-3 rounded hover:bg-stone-50 transition">Schließen</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative transition-colors duration-700">
      <form onSubmit={handleLogin} className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="w-4 h-4 rounded-full bg-stone-200 mb-8 animate-pulse" />
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Zugangscode"
          className={`bg-transparent border-b-2 outline-none text-center text-xl font-light tracking-widest pb-2 w-64 transition-colors ${
            error ? 'border-red-400 text-red-500' : 'border-stone-200 text-stone-800 focus:border-stone-800'
          }`}
        />
      </form>

      <div 
        className="fixed bottom-0 right-0 w-24 h-24 cursor-default opacity-0" 
        onDoubleClick={handleHiddenClick}
      />
    </div>
  );
};

export default LockScreen;