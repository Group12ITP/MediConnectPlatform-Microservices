import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Calendar, Clock, Video, User, CheckCircle, XCircle, AlertCircle, FileText, MessageCircle, Filter, Search, CalendarDays, Sparkles, MoreVertical, Eye, X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const doctorHeaders = () => {
  const token = localStorage.getItem('doctorToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const AppointmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [toast, setToast] = useState(null);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Live polling
  const [isLive, setIsLive] = useState(true);
  const pollingRef = useRef(null);

  const { t } = useLanguage();


  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API}/appointments/requests?status=all`, { headers: doctorHeaders() });
      const json = await res.json();
      if (json.success) setRequests(json.data);
    } catch { if (!silent) showToast('Failed to load requests', 'error'); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  // Live polling every 30 seconds
  useEffect(() => {
    if (!isLive) { clearInterval(pollingRef.current); return; }
    pollingRef.current = setInterval(() => loadRequests(true), 30000);
    return () => clearInterval(pollingRef.current);
  }, [isLive, loadRequests]);


  const handleConfirm = async (id) => {
    try {
      const res = await fetch(`${API}/appointments/${id}/confirm`, { method: 'PATCH', headers: doctorHeaders() });
      const json = await res.json();
      if (json.success) {
        showToast(`✅ Confirmed! Notifications sent to patient. Room: ${json.data.videoRoomId}`);
        loadRequests();
        setShowDetails(false);
      } else showToast(json.message, 'error');
    } catch { showToast('Error confirming', 'error'); }
  };

  const openRejectModal = (id) => {
    setRejectModal({ id });
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectModal) return;
    setRejecting(true);
    try {
      const res = await fetch(`${API}/appointments/${rejectModal.id}/reject`, {
        method: 'PATCH',
        headers: doctorHeaders(),
        body: JSON.stringify({ reason: rejectReason || 'Doctor unavailable' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('❌ Appointment declined. Patient notified via email & SMS.');
        loadRequests();
        setShowDetails(false);
        setRejectModal(null);
      } else showToast(json.message, 'error');
    } catch { showToast('Error rejecting', 'error'); }
    finally { setRejecting(false); }
  };


  const handleComplete = async (id) => {
    try {
      const res = await fetch(`${API}/appointments/${id}/complete`, { method: 'PATCH', headers: doctorHeaders() });
      const json = await res.json();
      if (json.success) { showToast('✔️ Marked as completed. Notifications sent.'); loadRequests(); }
      else showToast(json.message, 'error');
    } catch { showToast('Error', 'error'); }
  };


  const getPriorityColor = (status) => ({
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
  }[status] || 'bg-gray-100 text-gray-700 border-gray-200');

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const filtered = useMemo(() => {
    let f = requests;
    if (searchQuery) f = f.filter(r => r.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.reason?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedPriority !== 'all') f = f.filter(r => r.status === selectedPriority);
    if (selectedDate !== 'all') {
      const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      f = f.filter(r => {
        const rd = new Date(r.date + 'T00:00:00');
        if (selectedDate === 'today') return rd.toDateString() === today.toDateString();
        if (selectedDate === 'tomorrow') return rd.toDateString() === tomorrow.toDateString();
        if (selectedDate === 'this-week') { const we = new Date(today); we.setDate(today.getDate() + 7); return rd >= today && rd <= we; }
        return true;
      });
    }
    return f;
  }, [requests, searchQuery, selectedPriority, selectedDate]);

  const stats = { total: requests.length, pending: requests.filter(r => r.status === 'pending').length, confirmed: requests.filter(r => r.status === 'confirmed').length, today: requests.filter(r => new Date(r.date + 'T00:00:00').toDateString() === new Date().toDateString()).length };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-6 lg:p-10">
        {toast && (
          <div className="fixed top-6 right-6 z-50">
            <div className={`rounded-2xl shadow-2xl border p-4 flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-emerald-200'}`}>
              <Sparkles className={`w-5 h-5 ${toast.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}/>
              <p className="text-sm font-medium text-gray-800">{toast.msg}</p>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white text-center">
                <div className="text-4xl mb-2">🚫</div>
                <h2 className="text-xl font-bold">Decline Appointment</h2>
                <p className="text-red-100 text-sm mt-1">Patient will be notified via email & SMS</p>
              </div>
              <div className="p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for declining</label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Schedule conflict, not available on this date..."
                  className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl p-3 text-sm outline-none resize-none transition-colors"
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setRejectModal(null)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                    Back
                  </button>
                  <button onClick={confirmReject} disabled={rejecting}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold disabled:opacity-60 hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2">
                    {rejecting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Declining...</> : 'Confirm Decline'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-sm border border-slate-200 mb-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"/>
                <span className="text-sm font-semibold text-slate-600">Request Management</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-slate-800">{t('doctorPages.appointmentRequestsTitle')}</h1>
                {/* Live toggle */}
                <button onClick={() => setIsLive(p => !p)}
                  title={isLive ? 'Auto-refresh ON — click to pause' : 'Auto-refresh OFF — click to enable'}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${isLive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}/>
                  {isLive ? 'LIVE' : 'PAUSED'}
                </button>
              </div>

              <p className="text-slate-500 mt-1">{t('doctorPages.noRequests')}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"/>
                <input type="text" placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-teal-500 w-72 text-sm shadow-sm"/>
              </div>
              {['grid','list'].map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`p-2.5 rounded-xl transition-colors ${viewMode === m ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                  {m === 'grid' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[{label:'Total Requests',val:stats.total,cls:'from-teal-600 to-teal-700',text:'text-white'},{label:'Pending',val:stats.pending,cls:'from-amber-400 to-amber-500',text:'text-white'},{label:'Confirmed',val:stats.confirmed,cls:'from-emerald-400 to-emerald-500',text:'text-white'},{label:"Today's",val:stats.today,cls:'from-blue-400 to-blue-500',text:'text-white'}].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.cls} rounded-2xl p-4 shadow-lg`}>
                <p className={`text-sm opacity-90 ${s.text}`}>{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-200">
              <Filter className="w-4 h-4 text-slate-500"/>
              <span className="text-sm text-slate-600">Status:</span>
              {['all','pending','confirmed','completed'].map(s => (
                <button key={s} onClick={() => setSelectedPriority(s)}
                  className={`px-3 py-1 rounded-lg text-sm capitalize transition-colors ${selectedPriority === s ? 'bg-teal-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{s}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-slate-200">
              <CalendarDays className="w-4 h-4 text-slate-500"/>
              <span className="text-sm text-slate-600">Date:</span>
              {['all','today','tomorrow','this-week'].map(f => (
                <button key={f} onClick={() => setSelectedDate(f)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${selectedDate === f ? 'bg-teal-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                  {f === 'this-week' ? 'This Week' : f}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-slate-500">Showing {filtered.length} of {requests.length}</div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="text-7xl mb-4">🎉</div>
            <h3 className="text-2xl font-semibold text-gray-700">{t('appointments.noAppointments')}</h3>
            <p className="text-gray-500 mt-2">All caught up!</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map(req => (
              <div key={req._id} className="bg-white rounded-3xl shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className={`h-1.5 ${req.status === 'pending' ? 'bg-amber-400' : req.status === 'confirmed' ? 'bg-emerald-500' : 'bg-blue-400'}`}/>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center text-2xl font-bold text-teal-700">
                        {req.patient?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-slate-800">{req.patient?.name || 'Patient'}</h3>
                        <p className="text-teal-600 text-sm font-medium">{req.type || 'Video Consultation'}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border capitalize ${getPriorityColor(req.status)}`}>{req.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-teal-500"/>{formatDate(req.date)}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-teal-500"/>{req.time}</div>
                    {req.patient?.gender && <div className="flex items-center gap-2"><User className="w-4 h-4 text-teal-500"/>{req.patient.gender}</div>}
                    <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-teal-500"/>LKR {req.consultationFee?.toLocaleString()}</div>
                  </div>

                  {req.reason && <div className="bg-slate-50 rounded-2xl p-3 mb-4 text-sm text-slate-700">{req.reason}</div>}

                  {req.patient?.medicalConditions?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {req.patient.medicalConditions.map((c, i) => <span key={i} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-lg">{c}</span>)}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => handleConfirm(req._id)}
                          className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition-all">
                          <CheckCircle className="w-5 h-5"/>{t('doctorPages.approve')}
                        </button>
                        <button onClick={() => openRejectModal(req._id)}
                          className="flex-1 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition-all">
                          <XCircle className="w-5 h-5"/>{t('doctorPages.decline')}
                        </button>
                      </>
                    )}

                    {req.status === 'confirmed' && (
                      <>
                        <button onClick={() => window.open(`https://meet.jit.si/${req.videoRoomId}`, '_blank')}
                          className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2">
                          <Video className="w-5 h-5"/>Join Room
                        </button>
                        <button onClick={() => handleComplete(req._id)}
                          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5"/>Complete
                        </button>
                      </>
                    )}
                    {req.status === 'completed' && (
                      <div className="flex-1 py-3 text-center text-blue-600 bg-blue-50 rounded-2xl font-semibold text-sm">✔️ Completed</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Patient','Date & Time','Type','Status','Fee','Actions'].map(h => <th key={h} className="text-left p-4 font-semibold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(req => (
                  <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4"><p className="font-semibold text-slate-800">{req.patient?.name}</p><p className="text-xs text-slate-500">{req.patient?.gender}</p></td>
                    <td className="p-4"><p className="text-sm font-medium">{req.date}</p><p className="text-xs text-slate-500">{req.time}</p></td>
                    <td className="p-4 text-sm text-slate-700">{req.type}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full border capitalize ${getPriorityColor(req.status)}`}>{req.status}</span></td>
                    <td className="p-4 text-sm font-semibold text-emerald-600">LKR {req.consultationFee?.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {req.status === 'pending' && <>
                          <button onClick={() => handleConfirm(req._id)} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700">Accept</button>
                          <button onClick={() => openRejectModal(req._id)} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50">Decline</button>
                        </>}

                        {req.status === 'confirmed' && <>
                          <button onClick={() => window.open(`https://meet.jit.si/${req.videoRoomId}`, '_blank')} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs">Join</button>
                          <button onClick={() => handleComplete(req._id)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs">Complete</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentRequests;