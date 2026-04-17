import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, FileText, Video, Bell, Stethoscope } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const headers = () => {
  const token = localStorage.getItem('doctorToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  const doctorInfo = JSON.parse(localStorage.getItem('doctorInfo') || '{}');
  const doctorName = doctorInfo.name ? doctorInfo.name.split(' ')[0] : 'Doctor';

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? t('dashboard.welcomeBack') : currentHour < 18 ? t('dashboard.welcomeBack') : t('dashboard.welcomeBack');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(`${API}/appointments/requests?status=all`, { headers: headers() });
        const json = await res.json();
        if (json.success) {
          setAppointments(json.data || []);
        } else {
          setError(json.message || 'Failed to load appointments');
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const totalPatients = new Set(appointments.map(a => String(a.patient?._id || a.patient))).size;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const todayCount = appointments.filter(a => a.date === today && a.status !== 'cancelled' && a.status !== 'rejected').length;
  const confirmedAppointments = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'completed')
    .sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));

  const statCards = [
    { label: t('dashboard.todaysAppointments'), value: todayCount, icon: Calendar, color: 'teal', trend: t('dashboard.scheduledToday') },
    { label: t('dashboard.pendingRequests'), value: pendingCount, icon: Clock, color: 'amber', trend: t('dashboard.requiresAttention') },
    { label: t('dashboard.totalPatients'), value: totalPatients, icon: Users, color: 'blue', trend: t('dashboard.allTimeUnique') },
    { label: t('dashboard.totalAppointments'), value: appointments.length, icon: FileText, color: 'violet', trend: t('dashboard.allStatuses') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-6 lg:p-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-sm border border-slate-200 mb-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-slate-600">{t('dashboard.doctorPortalBadge')}</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{greeting}, Dr. {doctorName} 👨‍⚕️</h1>
            <p className="text-slate-500 mt-1 text-lg">{t('dashboard.hereIsOverview')}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-200">
              <Bell className="w-5 h-5 text-slate-600" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm border border-slate-200">
              <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Dr. {doctorName}</p>
                <p className="text-xs text-slate-500">{doctorInfo.specialization}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl p-7 shadow-md hover:shadow-xl border border-slate-100 hover:border-teal-200 transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl bg-${stat.color}-50 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-7 h-7 text-${stat.color}-600`} />
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold text-slate-800 tabular-nums">{stat.value}</p>
                </div>
              </div>
              <div className="mt-6">
                <p className="font-semibold text-slate-700 text-lg">{stat.label}</p>
                <p className="text-sm mt-1 text-slate-500">{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Confirmed Appointments */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-2xl">
              <Calendar className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{t('dashboard.recentlyConfirmed')}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t('dashboard.confirmedCompleted')}</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {confirmedAppointments.length > 0 ? (
              confirmedAppointments.slice(0, 10).map((appt) => (
                <div key={appt._id} className="px-8 py-6 hover:bg-slate-50 transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-20 text-center">
                        <p className="text-xl font-bold text-slate-800 tabular-nums">{appt.time}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{appt.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center text-3xl shadow-inner">👤</div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-slate-800 text-lg">{appt.patient?.name || 'Unknown'}</p>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              appt.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700'
                            }`}>{appt.status}</span>
                          </div>
                          <div className="flex items-center gap-5 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Video className="w-4 h-4 text-blue-500" />
                              {appt.reason || 'Video Consultation'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {appt.status === 'confirmed' && appt.videoRoomId && (
                      <button
                        onClick={() => window.open(`https://meet.jit.si/${appt.videoRoomId}`, '_blank')}
                        className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-2xl font-medium shadow-lg shadow-teal-200 transition-all flex items-center gap-2 hover:scale-105"
                      >
                        <Video className="w-5 h-5" /> {t('dashboard.joinCall')}
                      </button>
                    )}
                    {appt.status === 'completed' && (
                      <div className="px-6 py-3 text-emerald-600 font-medium">{t('dashboard.completed')}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-8 py-16 text-center">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-slate-500 font-medium">{t('dashboard.noConfirmedYet')}</p>
                <p className="text-slate-400 text-sm mt-1">{t('dashboard.acceptPending')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;