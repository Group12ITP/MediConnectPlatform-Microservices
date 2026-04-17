import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';

const DoctorSidebar = ({ activePage, setActivePage, onLogout, isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [openSections, setOpenSections] = useState({ schedule: true });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getDoctorInfo = () => {
    const stored = localStorage.getItem('doctorInfo');
    if (stored) return JSON.parse(stored);
    return { name: 'Doctor', specialization: 'Specialist' };
  };

  const doctorInfo = getDoctorInfo();

  const handleLogout = async () => {
    const token = localStorage.getItem('doctorToken');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.warn('Logout API call failed, clearing session locally.', err);
    } finally {
      localStorage.removeItem('doctorToken');
      localStorage.removeItem('doctorInfo');
      localStorage.removeItem('doctorEmail');
      localStorage.removeItem('doctorRemember');
      if (onLogout) onLogout();
      navigate('/doctor/login');
    }
  };

  const menuItems = [
    { id: 'doctor-dashboard', label: t('nav.dashboard'), icon: '📊' },
    { id: 'profile', label: t('nav.myProfile'), icon: '👤' },
    { id: 'schedule', label: t('nav.mySchedule'), icon: '📅', hasSubmenu: true },
    { id: 'appointment-requests', label: t('nav.appointmentRequests'), icon: '📬' },
    { id: 'video-consultations', label: t('nav.videoConsultations'), icon: '📹' },
    { id: 'issue-prescriptions', label: t('nav.issuePrescriptions'), icon: '💊' },
    { id: 'patient-reports', label: t('nav.patientReports'), icon: '📋' },
    { id: 'my-patients', label: t('nav.myPatients'), icon: '👥' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={`fixed md:static top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="px-6 py-5 border-b flex items-center gap-x-3">
        <div className="w-9 h-9 bg-teal-600 rounded-2xl flex items-center justify-center text-white text-3xl">🩺</div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">MediConnect</span>
          <span className="block text-xs font-medium text-teal-600 -mt-1">{t('nav.doctorPortal')}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map((item) => (
          <div key={item.id} className="mb-1">
            <button
              onClick={() => {
                setActivePage(item.id);
                if (item.hasSubmenu) toggleSection(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-x-3 px-4 py-3 rounded-2xl text-left text-sm font-medium transition-all ${
                activePage === item.id ? 'bg-teal-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.hasSubmenu && (
                <span className={`text-xs transition-transform ${openSections[item.id] ? 'rotate-180' : ''}`}>▼</span>
              )}
            </button>

            {item.hasSubmenu && openSections[item.id] && (
              <div className="ml-9 mt-1 space-y-1">
                <button onClick={() => { setActivePage('set-availability'); if (onClose) onClose(); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">{t('nav.setAvailability')}</button>
                <button onClick={() => { setActivePage('view-full-schedule'); if (onClose) onClose(); }} className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">{t('nav.viewFullSchedule')}</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mx-4 mb-6 space-y-3">
        {/* Language Switcher */}
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">{t('language.select')}</span>
          <LanguageSwitcher variant="default" />
        </div>

        {/* Doctor info + logout */}
        <div className="p-4 bg-teal-50 border border-teal-100 rounded-3xl">
          <div className="flex items-center gap-x-3 mb-3">
            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center text-2xl">👨‍⚕️</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{doctorInfo.name ? `Dr. ${doctorInfo.name}` : 'Doctor'}</p>
              <p className="text-xs text-teal-600">{doctorInfo.specialization || 'Specialist'} • Online</p>
            </div>
          </div>
          <button
            onClick={() => { handleLogout(); if (onClose) onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-sm font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            {t('common.logout')}
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

export default DoctorSidebar;