import { useState, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
  { code: 'si', label: 'සිංහල', flag: '🇱🇰', short: 'SI' },
];

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Compact variant (for sidebar / tight spaces) ────────────────
  if (variant === 'compact') {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
        >
          <span>{current.flag}</span>
          <span>{current.short}</span>
          <span className={`text-[9px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {open && (
          <div className="absolute bottom-full mb-2 left-0 w-36 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all hover:bg-emerald-50 ${
                  language === lang.code ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-gray-700'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
                {language === lang.code && <span className="ml-auto text-emerald-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Default variant (for header bar) ────────────────────────────
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        id="language-switcher-btn"
        className="flex items-center gap-1.5 px-3 py-2 rounded-2xl hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-all border border-transparent hover:border-gray-200"
      >
        <span className="text-base">{current.flag}</span>
        <span>{current.short}</span>
        <span className={`text-[10px] text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-40 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-2 border-b border-gray-50">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">{t('language.select')}</p>
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-emerald-50 ${
                language === lang.code ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.label}</span>
              {language === lang.code && <span className="text-emerald-500 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
