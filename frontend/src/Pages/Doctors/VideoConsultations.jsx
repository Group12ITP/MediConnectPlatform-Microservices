import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const authHeaders = () => {
  const token = localStorage.getItem('doctorToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const VideoConsultations = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [filter, setFilter] = useState('confirmed');
  const { t } = useLanguage();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/appointments/requests?status=all`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data || []);
      } else {
        setError(json.message || 'Failed to load consultations');
      }
    } catch (err) {
      console.error('Failed to load consultations:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinCall = (appt) => {
    if (appt.videoRoomId) {
      window.open(`https://meet.jit.si/${appt.videoRoomId}`, '_blank');
    } else {
      alert('No video room assigned yet. Please wait for the appointment to be fully confirmed with a room link.');
    }
  };

  const handleComplete = async (appt) => {
    if (!window.confirm(`Mark consultation with ${appt.patient?.name || 'this patient'} as completed?`)) return;
    setCompleting(appt._id);
    try {
      const res = await fetch(`${API}/appointments/${appt._id}/complete`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setAppointments(prev =>
          prev.map(a => a._id === appt._id ? { ...a, status: 'completed' } : a)
        );
      } else {
        alert(json.message || 'Failed to complete appointment');
      }
    } catch (err) {
      alert('Network error completing appointment');
    } finally {
      setCompleting(null);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const completed = appointments.filter(a => a.status === 'completed');
  const todayConfirmed = confirmed.filter(a => a.date === today);
  const upcomingConfirmed = confirmed.filter(a => a.date > today);
  const pastConfirmed = confirmed.filter(a => a.date < today);

  const liveNow = confirmed.find(a => {
    if (a.date !== today) return false;
    // Check if current time is within the appointment window
    const [h, m] = a.time.split(':').map(Number);
    const apptMinutes = h * 60 + m;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes >= apptMinutes && nowMinutes < apptMinutes + 60;
  });

  const displayList = filter === 'confirmed' ? confirmed : appointments;

  const getStatusBadge = (status) => {
    const map = {
      confirmed: 'bg-teal-50 text-teal-700 border border-teal-200',
      completed: 'bg-blue-50 text-blue-700 border border-blue-200',
      pending: 'bg-amber-50 text-amber-700 border border-amber-200',
      cancelled: 'bg-red-50 text-red-700 border border-red-200',
      rejected: 'bg-red-50 text-red-700 border border-red-200',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const isToday = (dateStr) => dateStr === today;
  const isPast = (dateStr) => dateStr < today;

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-teal-50/30 rounded-3xl p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {t('video.title')}
              </h1>
              <p className="text-gray-500 mt-1">{t('doctorPages.noVideoConsultations')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {liveNow && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600">Live Consultation In Progress</span>
              </div>
            )}
            <button
              onClick={fetchAppointments}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Calls", value: todayConfirmed.length, color: 'teal', icon: '📅' },
            { label: 'Upcoming', value: upcomingConfirmed.length, color: 'blue', icon: '📆' },
            { label: 'Completed', value: completed.length, color: 'emerald', icon: '✅' },
            { label: 'Live Now', value: liveNow ? 1 : 0, color: 'red', icon: '🔴' },
          ].map((s, i) => (
            <div key={i} className={`bg-gradient-to-br from-${s.color}-50 to-${s.color}-100/50 rounded-2xl p-4 border border-${s.color}-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-${s.color}-600 text-sm font-medium`}>{s.label}</p>
                  <p className={`text-2xl font-bold text-${s.color}-900`}>{s.value}</p>
                </div>
                <div className={`w-10 h-10 bg-${s.color}-200 rounded-full flex items-center justify-center`}>
                  <span className="text-xl">{s.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6">
          {[
            { key: 'confirmed', label: `Confirmed (${confirmed.length})` },
            { key: 'all', label: `All Appointments (${appointments.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                filter === tab.key
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Today's Consultations Section */}
        {filter === 'confirmed' && todayConfirmed.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <span>📍 Today's Consultations</span>
              <span className="text-sm bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
                {todayConfirmed.length} scheduled
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {todayConfirmed.map(appt => (
                <AppointmentCard
                  key={appt._id}
                  appt={appt}
                  isLive={liveNow?._id === appt._id}
                  onJoin={handleJoinCall}
                  onComplete={handleComplete}
                  completing={completing === appt._id}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Section */}
        {filter === 'confirmed' && upcomingConfirmed.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <span>📅 Upcoming Consultations</span>
              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                {upcomingConfirmed.length} scheduled
              </span>
            </h2>
            <div className="space-y-3">
              {upcomingConfirmed.map(appt => (
                <AppointmentRow
                  key={appt._id}
                  appt={appt}
                  onJoin={handleJoinCall}
                  onComplete={handleComplete}
                  completing={completing === appt._id}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Confirmed (no room yet passed) */}
        {filter === 'confirmed' && pastConfirmed.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <span>⏮️ Past Confirmed (Not Completed)</span>
            </h2>
            <div className="space-y-3">
              {pastConfirmed.map(appt => (
                <AppointmentRow
                  key={appt._id}
                  appt={appt}
                  onJoin={handleJoinCall}
                  onComplete={handleComplete}
                  completing={completing === appt._id}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Appointments view */}
        {filter === 'all' && (
          <div className="space-y-3">
            {displayList.length === 0 ? (
              <EmptyState message="No appointments found." />
            ) : (
              displayList.map(appt => (
                <AppointmentRow
                  key={appt._id}
                  appt={appt}
                  onJoin={handleJoinCall}
                  onComplete={handleComplete}
                  completing={completing === appt._id}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </div>
        )}

        {/* Empty state for confirmed */}
        {filter === 'confirmed' && confirmed.length === 0 && !loading && (
          <EmptyState message={t('doctorPages.noVideoConsultations')} subtext={t('doctorPages.noRequests')} />
        )}
      </div>
    </div>
  );
};

const AppointmentCard = ({ appt, isLive, onJoin, onComplete, completing, getStatusBadge }) => (
  <div className={`relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isLive ? 'ring-2 ring-red-400' : ''}`}>
    {isLive && (
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full shadow">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-xs font-bold">LIVE NOW</span>
      </div>
    )}
    <div className="p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center text-4xl shadow-sm">
          👤
        </div>
        <div className="flex-1">
          <p className="font-bold text-xl text-gray-800">{appt.patient?.name || 'Patient'}</p>
          <p className="text-sm text-gray-500 mt-0.5">{appt.reason || 'Video Consultation'}</p>
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(appt.status)}`}>{appt.status}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-5 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-gray-800">{appt.time}</span>
        </div>
        <span className="text-sm text-gray-500">{appt.date}</span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onJoin(appt)}
          disabled={!appt.videoRoomId}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all text-white flex items-center justify-center gap-2 ${
            !appt.videoRoomId
              ? 'bg-gray-300 cursor-not-allowed'
              : isLive
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200 hover:scale-105'
              : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-200 hover:scale-105'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {!appt.videoRoomId ? 'No Room Yet' : isLive ? 'Join Live' : 'Join Call'}
        </button>
        <button
          onClick={() => onComplete(appt)}
          disabled={completing}
          className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all font-medium text-sm"
          title="Mark as Completed"
        >
          {completing ? '...' : '✓'}
        </button>
      </div>
    </div>
  </div>
);

const AppointmentRow = ({ appt, onJoin, onComplete, completing, getStatusBadge }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center text-2xl">
          👤
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800">{appt.patient?.name || 'Patient'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadge(appt.status)}`}>{appt.status}</span>
          </div>
          <p className="text-sm text-gray-500">{appt.reason || 'Video Consultation'}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-teal-600 font-medium">
            <span>{appt.date} • {appt.time}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        {appt.status === 'confirmed' && (
          <>
            <button
              onClick={() => onJoin(appt)}
              disabled={!appt.videoRoomId}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all text-white flex items-center gap-2 ${
                !appt.videoRoomId
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 hover:scale-105 shadow-md'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {appt.videoRoomId ? 'Join Call' : 'No Room'}
            </button>
            <button
              onClick={() => onComplete(appt)}
              disabled={completing}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium text-sm transition-all"
            >
              {completing ? '...' : 'Complete'}
            </button>
          </>
        )}
        {appt.status === 'completed' && (
          <span className="px-4 py-2.5 text-blue-600 font-medium text-sm">✓ Completed</span>
        )}
        {appt.status === 'pending' && (
          <span className="px-4 py-2.5 text-amber-600 font-medium text-sm bg-amber-50 rounded-xl">Awaiting Confirmation</span>
        )}
      </div>
    </div>
  </div>
);

const EmptyState = ({ message, subtext }) => (
  <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
    <div className="text-5xl mb-4">📹</div>
    <p className="text-gray-500 font-medium text-lg">{message}</p>
    {subtext && <p className="text-gray-400 text-sm mt-2">{subtext}</p>}
  </div>
);

export default VideoConsultations;