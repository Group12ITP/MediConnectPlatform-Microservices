import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Pill, Video, ChevronRight, Sparkles, Clock, ArrowUpRight, Bell, User } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const headers = () => {
  const token = localStorage.getItem('patientToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const PatientDashboard = ({setActivePage }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const patientInfo = JSON.parse(localStorage.getItem('patientInfo') || '{}');
  const patientName = patientInfo.name ? patientInfo.name.split(' ')[0] : 'Patient';

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12
    ? t('dashboard.welcomeBack')
    : currentHour < 18
    ? t('dashboard.welcomeBack')
    : t('dashboard.welcomeBack');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API}/patient/dashboard`, { headers: headers() });
        const json = await res.json();
        if (json.success) setDashboardData(json.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/></div>;
  }

  const { stats, upcomingAppointments } = dashboardData || {
    stats: { upcomingAppointments: 0, totalReports: 0, activePrescriptions: 0, totalConsultations: 0 },
    upcomingAppointments: [],
  };

  const statCards = [
    { label: t('dashboard.upcomingAppointments'), value: stats.upcomingAppointments, icon: Calendar, color: 'emerald', trend: t('dashboard.nextUpcoming') },
    { label: t('dashboard.medicalRecords'), value: stats.totalReports, icon: FileText, color: 'blue', trend: t('dashboard.totalUploaded') },
    { label: t('dashboard.activePrescriptions'), value: stats.activePrescriptions, icon: Pill, color: 'purple', trend: t('dashboard.needsRefillCheck') },
    { label: t('dashboard.consultations'), value: stats.totalConsultations, icon: Video, color: 'orange', trend: t('dashboard.totalCompleted') },
  ];

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl shadow-xl overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-1">{t('dashboard.welcomeBack')}</h2>
            <h1 className="text-3xl font-bold text-gray-800">{greeting}, {patientName} ✨</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-md">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{patientName}</span>
            </div>
          </div>
        </div>

        {/* Greeting Banner */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-8 mb-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-emerald-300" />
                <span className="text-emerald-200 text-sm font-medium">{t('dashboard.healthSummary')}</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">{t('dashboard.readyForHealthyDay')}</h2>
              <p className="text-emerald-100 text-lg mb-6">
                {t('dashboard.youHave')} <span className="font-bold text-white">{stats.upcomingAppointments} {t('dashboard.upcomingAppts')}</span> {t('dashboard.rightNow')}
              </p>
              <button
  onClick={() => setActivePage('book')}
  className="group bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-3.5 rounded-2xl font-semibold flex items-center gap-x-2 shadow-lg hover:shadow-xl transition-all duration-300"
>
  {t('dashboard.bookNewAppointment')}
  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
</button>
            </div>
            <div className="hidden lg:flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-3xl p-6">
              <div className="text-7xl mb-2">🩺</div>
              <p className="text-white text-sm font-medium">{t('dashboard.yourHealth')}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, i) => (
            <div key={i} className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-50 rounded-xl group-hover:scale-110 transition-transform duration-300 text-${stat.color}-600`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
              </div>
              <div>
                <p className="text-gray-600 font-medium mb-1">{stat.label}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-600" /> {t('dashboard.upcomingAppointments')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('dashboard.yourScheduledConsultations')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingAppointments.length === 0 ? (
              <div className="col-span-full py-10 text-center text-gray-500">{t('dashboard.noUpcomingAppointments')}</div>
            ) : (
              upcomingAppointments.map((apt) => (
                <div key={apt._id} className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Video className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{apt.doctor?.name || 'Doctor'}</p>
                      <p className="text-sm text-gray-500">{apt.specialty || apt.doctor?.specialization}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="w-3.5 h-3.5" /><span>{apt.date}</span></div>
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-3.5 h-3.5" /><span>{apt.time}</span></div>
                  </div>

                  {apt.status === 'confirmed' && apt.videoRoomId && (
                    <button onClick={() => window.open(`https://meet.jit.si/${apt.videoRoomId}`, '_blank')} className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all flex items-center justify-center gap-2">
                      <Video className="w-4 h-4" /> {t('dashboard.joinVideoCall')}
                    </button>
                  )}
                  {apt.status === 'pending' && (
                    <button disabled className="w-full py-2.5 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                      {t('dashboard.waitingConfirmation')}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;