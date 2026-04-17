import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const VideoConsultationPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const exitPath = useMemo(() => {
    const hasDoctor = !!(localStorage.getItem('doctorToken') && localStorage.getItem('doctorInfo'));
    if (hasDoctor) return '/doctor/dashboard';
    return '/patient/dashboard';
  }, []);

  useEffect(() => {
    if (!roomId) {
      navigate(exitPath, { replace: true });
    }
  }, [roomId, navigate, exitPath]);

  const decodedRoomId = roomId ? decodeURIComponent(roomId) : '';
  const jitsiUrl = decodedRoomId ? `https://meet.jit.si/${decodedRoomId}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-900 flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl">
            🎥
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Secure Video Consultation</h1>
            <p className="text-xs text-emerald-200">
              You are connected via Jitsi Meet – end the call and close this tab when finished.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(exitPath)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-gray-100 hover:bg-white/20 border border-white/20 transition-all"
        >
          Exit to Dashboard
        </button>
      </header>

      {jitsiUrl ? (
        <main className="flex-1 flex flex-col">
          <div className="flex-1 m-4 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <iframe
              title="Video Consultation"
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture; clipboard-write"
              className="w-full h-full border-0"
            />
          </div>
        </main>
      ) : (
        <main className="flex-1 flex items-center justify-center text-center text-gray-200 px-4">
          <div>
            <p className="text-2xl font-semibold mb-2">Invalid video room</p>
            <p className="text-sm text-gray-400">
              We could not find a valid consultation room. Please return to your appointments and try
              again.
            </p>
            <button
              onClick={() => navigate(exitPath)}
              className="mt-6 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      )}
    </div>
  );
};

export default VideoConsultationPage;

