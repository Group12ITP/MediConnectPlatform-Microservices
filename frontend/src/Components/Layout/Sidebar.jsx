import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';

const Sidebar = ({ activePage, setActivePage, onLogout, isOpen = false, onClose }) => {
  const { t } = useLanguage();
  const [openSections, setOpenSections] = useState({ appointments: true, records: true });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: '📊', onClick: () => setActivePage('dashboard') },
    { id: 'browse-doctors', label: t('nav.browseDoctors'), icon: '👨‍⚕️', onClick: () => setActivePage('browse-doctors') },
    { id: 'profile', label: t('My Profile'), icon: '👤', onClick: () => setActivePage('profile') },
    { id: 'chatbot', label: t('nav.aiSymptomChecker'), icon: '🧬', onClick: () => setActivePage('chatbot') },
    { id: 'appointments', label: t('nav.appointments'), icon: '📅', hasSubmenu: true,
      submenu: [
        { label: t('nav.bookAppointment'), onClick: () => setActivePage('book') },
        { label: t('nav.myAppointments'), onClick: () => setActivePage('my-appointments') },
        { label: t('nav.videoConsultations'), onClick: () => setActivePage('video-consultations') },
      ]
    },
    { id: 'records', label: t('nav.medicalRecords'), icon: '📋', hasSubmenu: true,
      submenu: [
        { label: t('nav.uploadReports'), onClick: () => setActivePage('upload-reports') },
        { label: t('nav.medicalHistory'), onClick: () => setActivePage('medical-history') },
        { label: t('nav.prescriptions'), onClick: () => setActivePage('prescriptions') },
        { label: t('nav.pharmacyFinder'), onClick: () => setActivePage('pharmacy-finder') },
        { label: t('nav.healthMonitor'), onClick: () => setActivePage('health-reports') },
      ]
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientInfo");
    if (onLogout) onLogout();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={`fixed md:static top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b flex items-center gap-x-3">
        <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl">🧬</div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">MediConnect</span>
          <span className="block text-xs font-medium text-emerald-600 -mt-1">{t('nav.patientPortal')}</span>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map((item) => (
          <div key={item.id} className="mb-1">
            <button
              onClick={() => {
                item.onClick?.();
                if (item.hasSubmenu) toggleSection(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-x-3 px-4 py-3 rounded-2xl text-left text-sm font-medium transition-all ${
                activePage === item.id ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.hasSubmenu && <span className={`text-xs transition-transform ${openSections[item.id] ? 'rotate-180' : ''}`}>▼</span>}
            </button>

            {item.hasSubmenu && openSections[item.id] && (
               <div className="ml-9 mt-1 space-y-1">
                 {item.submenu.map((sub, i) => (
                   <button
                     key={i}
                    onClick={() => {
                      sub.onClick();
                      if (onClose) onClose();
                    }}
                     className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-emerald-600 rounded-xl flex items-center gap-x-2 transition-all"
                   >
                     <span className="text-emerald-500">•</span> {sub.label}
                   </button>
                 ))}
               </div>
            )}
          </div>
        ))}
      </div>

      {/* Language Switcher + Logout */}
      <div className="mx-4 mb-6 space-y-3">
        {/* Language */}
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">{t('language.select')}</span>
          <LanguageSwitcher variant="default" />
        </div>

        {/* Logout */}
        <div className="p-4 bg-red-50 border border-red-100 rounded-3xl">
          <button onClick={() => { handleLogout(); if (onClose) onClose(); }} className="text-sm font-bold bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-2xl w-full transition-all flex items-center justify-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            {t('nav.signOut')}
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

export default Sidebar;