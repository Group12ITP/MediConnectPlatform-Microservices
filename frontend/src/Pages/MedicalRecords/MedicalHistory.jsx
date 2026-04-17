import { useState, useEffect, useMemo } from 'react';
import { Calendar, Stethoscope, ClipboardList, Pill, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const patientHeaders = () => {
  const token = localStorage.getItem('patientToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const MedicalHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const res = await fetch(`${API}/patient/history`, { headers: patientHeaders() });
        const json = await res.json();
        if (!json.success) {
          setError(json.message || 'Could not load medical history');
          return;
        }
        setAppointments(json.data?.appointments || []);
        setPrescriptions(json.data?.prescriptions || []);
      } catch {
        setError('Network error loading medical history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const timeline = useMemo(() => {
    const items = [];

    appointments.forEach((a) => {
      const t = a.date ? `${a.date}T12:00:00` : null;
      items.push({
        key: `apt-${a._id}`,
        sort: t ? new Date(t).getTime() : 0,
        type: 'appointment',
        doctorName: a.doctor?.name || 'Doctor',
        specialty: a.doctor?.specialization || a.specialty || 'Consultation',
        dateLabel: a.date,
        notes: a.doctorNotes,
        raw: a,
      });
    });

    prescriptions.forEach((p) => {
      const issued = p.issuedAt ? new Date(p.issuedAt) : null;
      items.push({
        key: `rx-${p._id}`,
        sort: issued ? issued.getTime() : 0,
        type: 'prescription',
        doctorName: p.doctor?.name || 'Doctor',
        specialty: p.doctor?.specialization || 'Prescription',
        dateLabel: issued
          ? issued.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '',
        medicines: p.medicines || [],
        notes: p.notes,
        raw: p,
      });
    });

    return items.sort((a, b) => b.sort - a.sort);
  }, [appointments, prescriptions]);

  const getSpecialtyIcon = (specialty) => {
    const s = specialty || '';
    if (s.includes('Cardio')) return '❤️';
    if (s.includes('Neuro')) return '🧠';
    if (s.includes('Derma')) return '🩺';
    if (s.includes('Ped')) return '👶';
    return '⚕️';
  };

  const getStatusColor = (dateStr) => {
    if (!dateStr) return 'bg-gray-100 text-gray-600';
    const recordDate = new Date(dateStr);
    if (Number.isNaN(recordDate.getTime())) return 'bg-gray-100 text-gray-600';
    const now = new Date();
    const diffDays = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) return 'bg-green-100 text-green-700';
    if (diffDays <= 90) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl shadow-xl p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your medical history…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl shadow-xl p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl shadow-xl p-8 overflow-auto">
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Medical History
            </h1>
          </div>
          <div className="px-4 py-2 bg-emerald-50 rounded-full text-sm font-medium text-emerald-700">
            {timeline.length} Records
          </div>
        </div>
        <p className="text-gray-500 ml-14 mt-1">Your complete medical consultation timeline</p>
      </div>

      <div className="relative">
        <div className="absolute left-[43px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-300 via-teal-200 to-emerald-100" />

        {timeline.length === 0 ? (
          <div className="ml-20 py-16 text-center text-gray-500">
            <p className="font-medium">No visits or prescriptions yet.</p>
            <p className="text-sm mt-2">Completed appointments and prescriptions from your doctors will appear here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {timeline.map((item) => (
              <div key={item.key} className="relative group">
                <div className="absolute left-[35px] -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 z-10 group-hover:scale-125 transition-transform duration-300" />

                <div className="ml-20 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-emerald-200">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                          {getSpecialtyIcon(item.specialty)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{item.doctorName}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                            <p className="text-sm text-emerald-700 font-medium">{item.specialty}</p>
                            {item.type === 'appointment' && (
                              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-100">
                                Visit
                              </span>
                            )}
                            {item.type === 'prescription' && (
                              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-white text-teal-700 border border-teal-100">
                                Prescription
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            item.type === 'appointment' ? `${item.raw?.date}T12:00:00` : item.raw?.issuedAt
                          )}`}
                        >
                          {item.type === 'appointment'
                            ? item.dateLabel
                              ? new Date(`${item.raw.date}T12:00:00`).toLocaleDateString('en-US', {
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'
                            : item.dateLabel
                            ? new Date(item.raw.issuedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : '—'}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {item.type === 'appointment' && item.raw?.date
                              ? new Date(`${item.raw.date}T12:00:00`).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : item.raw?.issuedAt
                                ? new Date(item.raw.issuedAt).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {item.type === 'prescription' && item.medicines?.length > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                            Prescribed Medications
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {item.medicines.map((med, i) => (
                            <div
                              key={i}
                              className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-gray-800">{med.name}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ') || med.dosage || '—'}
                                  </p>
                                </div>
                                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-emerald-700 font-bold">{i + 1}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.type === 'appointment' && item.notes && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl border-l-4 border-amber-400">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                              Clinical Notes
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">{item.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.type === 'prescription' && item.notes && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-xl border-l-4 border-amber-400">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                              Clinical Notes
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">{item.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.type === 'appointment' && !item.notes && (
                      <p className="text-sm text-gray-500 italic">No clinical notes for this visit.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;
