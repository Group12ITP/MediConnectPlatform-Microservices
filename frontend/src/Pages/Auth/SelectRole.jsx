import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';

const SelectRole = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const hasDoctor = !!(localStorage.getItem('doctorToken') && localStorage.getItem('doctorInfo'));
    const hasPatient = !!(localStorage.getItem('patientToken') && localStorage.getItem('patientInfo'));
    const hasPharmacist = !!(localStorage.getItem('pharmacistToken') && localStorage.getItem('pharmacistInfo'));
    const hasAdmin = !!(localStorage.getItem('adminToken') && localStorage.getItem('adminInfo'));
    const lastRole = localStorage.getItem('lastRole');

    if (hasDoctor || hasPatient || hasPharmacist || hasAdmin) {
      if (lastRole === 'doctor' && hasDoctor) { navigate('/doctor/dashboard', { replace: true }); return; }
      if (lastRole === 'pharmacist' && hasPharmacist) { navigate('/pharmacist/dashboard', { replace: true }); return; }
      if (lastRole === 'admin' && hasAdmin) { navigate('/admin/dashboard', { replace: true }); return; }
      if (hasPatient) { navigate('/patient/dashboard', { replace: true }); return; }
      if (hasDoctor) { navigate('/doctor/dashboard', { replace: true }); return; }
      if (hasPharmacist) { navigate('/pharmacist/dashboard', { replace: true }); return; }
      if (hasAdmin) { navigate('/admin/dashboard', { replace: true }); return; }
    }
  }, [navigate]);

  const roles = [
    {
      key: 'patient',
      emoji: '🧑‍🦰',
      colorClass: 'from-emerald-50 to-white border-emerald-100 hover:border-emerald-300',
      arrowColor: 'text-emerald-600',
      onClick: () => navigate('/patient/login'),
    },
    {
      key: 'doctor',
      emoji: '👨‍⚕️',
      colorClass: 'from-teal-50 to-white border-teal-100 hover:border-teal-300',
      arrowColor: 'text-teal-600',
      onClick: () => navigate('/doctor/login'),
    },
    {
      key: 'pharmacist',
      emoji: '💊',
      colorClass: 'from-cyan-50 to-white border-cyan-100 hover:border-cyan-300',
      arrowColor: 'text-cyan-600',
      onClick: () => navigate('/pharmacist/login'),
    },
    {
      key: 'admin',
      emoji: '🛡️',
      colorClass: 'from-indigo-50 to-white border-indigo-100 hover:border-indigo-300',
      arrowColor: 'text-indigo-600',
      onClick: () => navigate('/admin/login'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center p-6">
      {/* Language switcher top-right */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher variant="default" />
      </div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/40">
        <div className="p-10">
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-4xl mb-4 shadow-lg shadow-emerald-200">
              🧬
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900">{t('selectRole.title')}</h1>
            <p className="text-gray-600 mt-2">{t('selectRole.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {roles.map((role) => (
              <button
                key={role.key}
                onClick={role.onClick}
                className={`group text-left bg-gradient-to-br ${role.colorClass} border-2 rounded-3xl p-8 transition-all hover:shadow-xl`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl mb-4">{role.emoji}</p>
                    <h2 className="text-2xl font-bold text-gray-900">{t(`selectRole.${role.key}`)}</h2>
                    <p className="text-gray-600 mt-2 text-sm">{t(`selectRole.${role.key}Desc`)}</p>
                  </div>
                  <span className={`${role.arrowColor} font-semibold group-hover:translate-x-1 transition-transform`}>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
