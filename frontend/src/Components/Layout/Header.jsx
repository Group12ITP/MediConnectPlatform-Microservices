import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';

const Header = () => {
  const { t } = useLanguage();

  const patientInfo = (() => {
    try { return JSON.parse(localStorage.getItem('patientInfo') || '{}'); } catch { return {}; }
  })();
  const name = patientInfo.name ? patientInfo.name.split(' ')[0] : 'Patient';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="h-14 bg-white border-b flex items-center px-6 mb-0 justify-between shadow-sm">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder={t('common.search') + ' doctors, symptoms, appointments...'}
            className="w-full bg-gray-100 border border-transparent focus:border-emerald-300 rounded-3xl py-2.5 pl-10 pr-4 text-sm outline-none"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
        </div>
      </div>

      <div className="flex items-center gap-x-4">
        <LanguageSwitcher variant="default" />
        <button className="w-8 h-8 hover:bg-gray-100 rounded-2xl text-xl">⚙️</button>
        <button className="w-8 h-8 hover:bg-gray-100 rounded-2xl text-xl relative">
          🛎️
          <span className="absolute top-1 right-1 text-[9px] bg-red-500 text-white w-3.5 h-3.5 rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-x-2 cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-emerald-600">Patient</p>
          </div>
          <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold text-lg">{initial}</div>
        </div>
      </div>
    </div>
  );
};

export default Header;