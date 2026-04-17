import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import html2pdf from 'html2pdf.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const headers = () => {
  const token = localStorage.getItem('patientToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState(null);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState(null); // { id }
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState(null); // { apt }
  const [availability, setAvailability] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  // Live polling
  const [isLive, setIsLive] = useState(true);
  const pollingRef = useRef(null);

  const { t } = useLanguage();

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4500); };

  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API}/appointments/mine`, { headers: headers() });
      const json = await res.json();
      if (json.success) setAppointments(json.data);
    } catch { if (!silent) showToast('error', 'Failed to load appointments'); }
    finally { if (!silent) setLoading(false); }
  }, []);

  // Initial load
  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Live polling every 30 seconds
  useEffect(() => {
    if (!isLive) { clearInterval(pollingRef.current); return; }
    pollingRef.current = setInterval(() => fetchAppointments(true), 30000);
    return () => clearInterval(pollingRef.current);
  }, [isLive, fetchAppointments]);

  // Stripe return verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      fetch(`${API}/appointments/verify-payment?session_id=${sessionId}`)
        .then(r => r.json())
        .then(json => {
          if (json.success) {
            showToast('success', `✅ Appointment booked! ID: ${json.data.appointmentId}`);
            fetchAppointments();
            window.history.replaceState({}, '', window.location.pathname);
          }
        });
    }
  }, [fetchAppointments]);

  // ── Cancel helpers ──────────────────────────────────────────────────────────
  const openCancelModal = (apt) => {
    setCancelModal({ id: apt._id, appointmentId: apt.appointmentId, date: apt.date, time: apt.time });
    setCancelReason('');
  };

  const confirmCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API}/appointments/${cancelModal.id}/cancel`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (json.success) {
        setAppointments(prev => prev.map(a => a._id === cancelModal.id ? { ...a, status: 'cancelled' } : a));
        showToast('success', '✅ Appointment cancelled. Notifications sent.');
        setCancelModal(null);
      } else showToast('error', json.message);
    } catch { showToast('error', 'Error cancelling'); }
    finally { setCancelling(false); }
  };

  // ── Reschedule helpers ──────────────────────────────────────────────────────
  const openRescheduleModal = async (apt) => {
    setRescheduleModal({ apt });
    setNewDate(null);
    setNewTime(null);
    setAvailability({});
    setLoadingSlots(true);
    try {
      const now = new Date();
      const res = await fetch(
        `${API}/appointments/doctors/${apt.doctor._id}/availability?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      );
      const json = await res.json();
      if (json.success) setAvailability(json.data);
    } catch { showToast('error', 'Could not load availability'); }
    finally { setLoadingSlots(false); }
  };

  const confirmReschedule = async () => {
    if (!rescheduleModal || !newDate || !newTime) return;
    setRescheduling(true);
    try {
      const res = await fetch(`${API}/appointments/${rescheduleModal.apt._id}/reschedule`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ date: newDate, time: newTime }),
      });
      const json = await res.json();
      if (json.success) {
        setAppointments(prev => prev.map(a =>
          a._id === rescheduleModal.apt._id ? { ...a, date: newDate, time: newTime, status: 'pending' } : a
        ));
        showToast('success', '🔄 Appointment rescheduled! Notifications sent.');
        setRescheduleModal(null);
      } else showToast('error', json.message);
    } catch { showToast('error', 'Error rescheduling'); }
    finally { setRescheduling(false); }
  };

  // ── Video join ──────────────────────────────────────────────────────────────
  const handleJoinVideo = (apt) => {
    if (!apt.videoRoomId) return showToast('error', 'Video room not ready yet. Doctor must confirm first.');
    window.open(`https://meet.jit.si/${apt.videoRoomId}`, '_blank');
  };

  // ── Receipt PDF ─────────────────────────────────────────────────────────────
  const generateReceiptPDF = async (appointment) => {
    setGeneratingReceipt(true);
    try {
      showToast('info', 'Generating receipt...');
      const element = document.createElement('div');
      element.style.cssText = 'padding:40px;background:white;font-family:Arial,sans-serif;max-width:800px;margin:0 auto;line-height:1.6;';
      const currentDate = new Date().toLocaleString();
      const appointmentDate = new Date(appointment.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      element.innerHTML = `
        <div style="text-align:center;margin-bottom:30px;">
          <div style="font-size:48px;margin-bottom:10px;">🏥</div>
          <h1 style="color:#0d9488;margin-bottom:5px;font-size:28px;font-weight:bold;">MediConnect</h1>
          <p style="color:#6b7280;font-size:12px;">Healthcare Management System</p>
          <div style="margin-top:20px;padding:10px;background:linear-gradient(135deg,#0d9488,#0f766e);color:white;border-radius:8px;">
            <h2 style="font-size:20px;margin:0;">PAYMENT RECEIPT</h2>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:30px;padding:15px;background:#f9fafb;border-radius:8px;">
          <div><p style="color:#6b7280;font-size:11px;">RECEIPT NO</p><p style="font-weight:bold;">${appointment.appointmentId || appointment._id}</p></div>
          <div style="text-align:right;"><p style="color:#6b7280;font-size:11px;">DATE &amp; TIME</p><p style="font-size:13px;">${currentDate}</p></div>
        </div>
        <div style="margin-bottom:25px;">
          <h3 style="color:#374151;margin-bottom:15px;font-size:16px;font-weight:bold;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">📋 Appointment Details</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><p style="color:#6b7280;font-size:11px;">Appointment ID</p><p style="font-weight:600;">${appointment.appointmentId || 'N/A'}</p></div>
            <div><p style="color:#6b7280;font-size:11px;">Status</p><p style="font-weight:600;color:${appointment.status === 'completed' ? '#10b981' : '#f59e0b'}">${appointment.status?.toUpperCase()}</p></div>
            <div><p style="color:#6b7280;font-size:11px;">Appointment Date</p><p style="font-weight:600;">${appointmentDate}</p></div>
            <div><p style="color:#6b7280;font-size:11px;">Appointment Time</p><p style="font-weight:600;">${appointment.time}</p></div>
          </div>
        </div>
        <div style="margin-bottom:25px;">
          <h3 style="color:#374151;margin-bottom:15px;font-size:16px;font-weight:bold;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">👨‍⚕️ Doctor Information</h3>
          <div style="background:#f0fdf4;padding:15px;border-radius:8px;">
            <p style="font-size:15px;font-weight:600;">${appointment.doctor?.name || 'N/A'}</p>
            <p>${appointment.specialty || appointment.doctor?.specialization || 'N/A'}</p>
          </div>
        </div>
        <div style="margin-bottom:25px;">
          <h3 style="color:#374151;margin-bottom:15px;font-size:16px;font-weight:bold;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">💰 Payment Summary</h3>
          <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);padding:20px;border-radius:8px;">
            <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;">
              <span>TOTAL AMOUNT</span><span style="color:#0d9488;">LKR ${appointment.consultationFee?.toLocaleString() || '0'}</span>
            </div>
            <div style="margin-top:15px;text-align:center;"><span style="background:#10b981;color:white;padding:5px 15px;border-radius:20px;font-size:12px;">✓ PAID</span></div>
          </div>
        </div>
        <div style="margin-top:30px;text-align:center;font-size:9px;color:#9ca3af;">
          <p>This is a computer-generated receipt. © ${new Date().getFullYear()} MediConnect</p>
        </div>`;
      document.body.appendChild(element);
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `receipt_${appointment.appointmentId || appointment._id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
      showToast('success', 'Receipt downloaded!');
    } catch (error) {
      showToast('error', `Failed to generate receipt: ${error.message}`);
    } finally { setGeneratingReceipt(false); }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const statusColor = (s) => ({
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-600',
    rejected: 'bg-gray-100 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-600');

  const statusIcon = (s) => ({ pending: '⏳', confirmed: '✅', completed: '✔️', cancelled: '❌', rejected: '🚫' }[s] || '📅');

  const canCancel = (apt) => !['completed', 'cancelled', 'rejected'].includes(apt.status);
  const canReschedule = (apt) => ['pending', 'confirmed'].includes(apt.status);

  const filtered = appointments.filter(a => {
    const matchSearch = a.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const reschedAvailDates = Object.keys(availability).sort();
  const reschedSlots = newDate && availability[newDate]
    ? availability[newDate].slots.filter(s => !availability[newDate].booked.includes(s))
    : [];

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-3xl p-8 overflow-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'
        } text-white`}>{toast.msg}</div>
      )}

      {/* PDF loading overlay */}
      {generatingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/>
            <p className="text-gray-700 font-medium">Generating Receipt...</p>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ─────────────────────────────────────────── */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white text-center">
              <div className="text-4xl mb-2">❌</div>
              <h2 className="text-xl font-bold">Cancel Appointment</h2>
              <p className="text-red-100 text-sm mt-1">{cancelModal.appointmentId}</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Are you sure you want to cancel your appointment on <strong>{cancelModal.date}</strong> at <strong>{cancelModal.time}</strong>?
                The doctor will be notified.
              </p>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for cancellation (optional)</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                placeholder="e.g. Schedule conflict, feeling better..."
                className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl p-3 text-sm outline-none resize-none transition-colors"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setCancelModal(null)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                  Keep Appointment
                </button>
                <button onClick={confirmCancel} disabled={cancelling}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {cancelling ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Cancelling...</> : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Modal ─────────────────────────────────────── */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-violet-500 to-violet-600 p-6 text-white text-center flex-shrink-0">
              <div className="text-4xl mb-2">🔄</div>
              <h2 className="text-xl font-bold">Reschedule Appointment</h2>
              <p className="text-violet-100 text-sm mt-1">
                Dr. {rescheduleModal.apt.doctor?.name} · Currently: {rescheduleModal.apt.date} at {rescheduleModal.apt.time}
              </p>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"/>
                </div>
              ) : reschedAvailDates.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No available dates this month for this doctor.</p>
              ) : (
                <>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Choose a New Date</label>
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {reschedAvailDates.map(date => (
                      <button key={date} onClick={() => { setNewDate(date); setNewTime(null); }}
                        className={`text-center py-3 rounded-xl transition-all text-sm font-medium ${newDate === date
                          ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg scale-105'
                          : 'bg-gray-50 hover:bg-violet-50 border-2 border-transparent hover:border-violet-200 text-gray-700'}`}>
                        <div className="text-xs opacity-70">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-lg font-bold">{new Date(date + 'T00:00:00').getDate()}</div>
                      </button>
                    ))}
                  </div>
                  {newDate && (
                    <>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Choose a New Time Slot</label>
                      {reschedSlots.length === 0 ? (
                        <p className="text-gray-400 text-sm">No free slots on this date.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {reschedSlots.map(time => (
                            <button key={time} onClick={() => setNewTime(time)}
                              className={`py-3 text-center rounded-xl font-semibold text-sm transition-all ${newTime === time
                                ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg scale-105'
                                : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}>
                              {time}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setRescheduleModal(null)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={confirmReschedule} disabled={!newDate || !newTime || rescheduling}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:from-violet-600 hover:to-violet-700 transition-all flex items-center justify-center gap-2">
                {rescheduling ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Rescheduling...</> : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{t('appointments.myAppointmentsTitle')}</h1>
                {/* Live indicator */}
                <button onClick={() => setIsLive(p => !p)}
                  title={isLive ? 'Auto-refresh ON (every 30s) — click to pause' : 'Auto-refresh OFF — click to enable'}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${isLive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}/>
                  {isLive ? 'LIVE' : 'PAUSED'}
                </button>
              </div>
              <p className="text-gray-500 mt-1">Track and manage your medical appointments</p>
            </div>
          </div>
          <div className="relative w-full lg:w-96">
            <input type="text" placeholder="Search by doctor, specialty or ID..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/80 border-2 border-gray-100 focus:border-emerald-400 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all" />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', count: appointments.length, color: 'emerald', icon: '📋' },
          { label: 'Upcoming', count: appointments.filter(a => ['pending','confirmed'].includes(a.status)).length, color: 'blue', icon: '⏰' },
          { label: 'Completed', count: appointments.filter(a => a.status === 'completed').length, color: 'purple', icon: '✅' },
          { label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length, color: 'red', icon: '❌' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br from-${s.color}-50 to-${s.color}-100/50 rounded-2xl p-4 border border-${s.color}-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-${s.color}-600 text-sm font-medium`}>{s.label}</p>
                <p className={`text-2xl font-bold text-${s.color}-900`}>{s.count}</p>
              </div>
              <span className="text-xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap text-sm capitalize ${filterStatus === s
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            {s === 'all' ? 'All' : s}
            {s !== 'all' && <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">{appointments.filter(a => a.status === s).length}</span>}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(apt => (
            <div key={apt._id} className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              {/* Status top bar */}
              <div className={`h-1.5 w-full ${apt.status === 'confirmed' ? 'bg-emerald-500' : apt.status === 'completed' ? 'bg-blue-500' : apt.status === 'cancelled' || apt.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`}/>
              <div className="p-6">
                {/* Top row */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{apt.appointmentId}</p>
                    <p className="text-emerald-600 font-semibold text-sm mt-1">{apt.date} at {apt.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusColor(apt.status)}`}>
                    {statusIcon(apt.status)} {apt.status}
                  </span>
                </div>

                {/* Doctor info */}
                <div className="mb-4 p-4 bg-gray-50 rounded-2xl">
                  <p className="text-lg font-bold text-gray-800">{apt.doctor?.name || 'Doctor'}</p>
                  <p className="text-emerald-600 text-sm font-medium">{apt.specialty || apt.doctor?.specialization}</p>
                  <p className="text-xs text-gray-500 mt-1">🏥 {apt.doctor?.hospital}</p>
                </div>

                {/* Status timeline */}
                <div className="flex items-center gap-1 mb-4">
                  {['pending', 'confirmed', 'completed'].map((s, i) => {
                    const statuses = ['pending', 'confirmed', 'completed'];
                    const currentIdx = statuses.indexOf(apt.status);
                    const isPast = i <= currentIdx;
                    const isActive = i === currentIdx;
                    if (['cancelled','rejected'].includes(apt.status)) {
                      return (
                        <div key={s} className="flex items-center gap-1">
                          {i > 0 && <div className="flex-1 h-0.5 w-6 bg-red-200"/>}
                          <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-400' : 'bg-gray-200'}`}/>
                        </div>
                      );
                    }
                    return (
                      <div key={s} className="flex items-center gap-1">
                        {i > 0 && <div className={`h-0.5 w-6 ${isPast ? 'bg-emerald-400' : 'bg-gray-200'}`}/>}
                        <div className={`w-2.5 h-2.5 rounded-full transition-all ${isActive ? 'bg-emerald-500 ring-2 ring-emerald-200' : isPast ? 'bg-emerald-400' : 'bg-gray-200'}`}/>
                        <span className="text-xs text-gray-400 hidden sm:inline">{s}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">Fee Paid</span>
                  <span className="font-semibold text-emerald-600">LKR {apt.consultationFee?.toLocaleString()}</span>
                </div>
                {apt.reason && <p className="text-xs text-gray-500 mb-4 bg-amber-50 p-2 rounded-lg">📝 {apt.reason}</p>}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* Join Video */}
                  {apt.status === 'confirmed' && (
                    <button onClick={() => handleJoinVideo(apt)}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      {t('dashboard.joinVideoCall')}
                    </button>
                  )}

                  {/* Reschedule */}
                  {canReschedule(apt) && (
                    <button onClick={() => openRescheduleModal(apt)}
                      className="flex-1 bg-gradient-to-r from-violet-500 to-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 shadow-md flex items-center justify-center gap-2">
                      🔄 Reschedule
                    </button>
                  )}

                  {/* Cancel */}
                  {canCancel(apt) && (
                    <button onClick={() => openCancelModal(apt)}
                      className="px-3 py-2.5 border-2 border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-1">
                      ✕
                    </button>
                  )}

                  {/* Receipt */}
                  <button onClick={() => generateReceiptPDF(apt)} disabled={generatingReceipt}
                    className="px-3 py-2.5 border-2 border-gray-200 hover:border-emerald-400 bg-white hover:bg-emerald-50 rounded-xl text-sm font-semibold text-gray-700 transition-all flex items-center justify-center gap-1 disabled:opacity-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📅</span>
          <p className="text-2xl font-semibold text-gray-400">{t('appointments.noAppointments')}</p>
          <p className="text-gray-400 mt-2">Book a new appointment to get started</p>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;