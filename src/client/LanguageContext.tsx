import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'de';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (enText: string, deText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (enText) => enText,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('vibecipes_lang');
    return saved === 'de' || saved === 'en' ? saved : 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('vibecipes_lang', newLang);
  };

  const t = (enText: string, deText: string) => {
    return lang === 'de' ? deText : enText;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="lang-toggle-group">
      <button
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLang('en')}
        title="Switch to English"
      >
        🇬🇧 EN
      </button>
      <button
        className={`lang-btn ${lang === 'de' ? 'active' : ''}`}
        onClick={() => setLang('de')}
        title="Auf Deutsch wechseln"
      >
        🇩🇪 DE
      </button>
    </div>
  );
}
