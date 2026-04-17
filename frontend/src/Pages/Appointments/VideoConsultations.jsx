import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const headers = () => {
  const token = localStorage.getItem('patientToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const VideoConsultations = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/appointments/mine`, { headers: headers() });
        const json = await res.json();
        if (json.success) setAppointments(json.data || []);
      } catch {
        showToast('error', 'Failed to load video consultations');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const parseDateTime = (apt) => {
    // backend stores date as yyyy-mm-dd and time as HH:mm or similar
    if (!apt.date || !apt.time) return null;
    const iso = `${apt.date}T${apt.time}`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const upcomingVideoAppointments = appointments
    .filter(
      (a) =>
        a.status === 'confirmed' &&
        a.type === 'Video' &&
        a.videoRoomId
    )
    .map((a) => ({ ...a, when: parseDateTime(a) }))
    .filter((a) => a.when && a.when.getTime() >= Date.now() - 30 * 60 * 1000) // from 30min ago onwards
    .sort((a, b) => a.when - b.when);

  const handleJoin = (apt) => {
    if (!apt.videoRoomId) {
      showToast('error', 'Video room not ready yet.');
      return;
    }
    navigate(`/patient/video/${encodeURIComponent(apt.videoRoomId)}`);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-3xl p-8 overflow-auto">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          } text-white`}
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl text-white">🎥</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Video Consultations
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Join your upcoming online appointments in one place
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : upcomingVideoAppointments.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl mb-4 block">📹</span>
          <p className="text-xl font-semibold text-gray-400">No upcoming video consultations</p>
          <p className="text-gray-400 mt-2">
            Book an appointment and wait for your doctor to confirm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingVideoAppointments.map((apt) => (
            <div
              key={apt._id}
              className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{apt.appointmentId}</p>
                    <p className="text-emerald-600 font-medium text-sm mt-1">
                      {apt.date} at {apt.time}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Confirmed
                  </span>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-2xl">
                  <p className="text-lg font-bold text-gray-800">
                    {apt.doctor?.name || 'Doctor'}
                  </p>
                  <p className="text-emerald-600 text-sm font-medium">
                    {apt.specialty || apt.doctor?.specialization}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">🏥 {apt.doctor?.hospital}</p>
                </div>

                <p className="text-xs text-gray-500 mb-4 bg-emerald-50 p-2 rounded-lg">
                  This is a secure online video consultation powered by Jitsi.
                </p>

                <button
                  onClick={() => handleJoin(apt)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Join Video Call
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoConsultations;

