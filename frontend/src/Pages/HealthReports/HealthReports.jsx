import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Droplets, Heart, Plus, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp,
  BookOpen, RefreshCw, Info, Zap, ArrowRight, BarChart2
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getPatientId = () => {
  try {
    const info = JSON.parse(localStorage.getItem('patientInfo') || '{}');
    return info._id || info.id || null;
  } catch { return null; }
};

const authHeaders = () => {
  const token = localStorage.getItem('patientToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

// ─── Classification colour map ────────────────────────────────────────────────
const LEVEL_META = {
  CRITICAL_LOW:  { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', border: '#7C3AED', emoji: '🚨', badge: 'Critical Low',  text: '#7C3AED' },
  LOW:           { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',  border: '#EF4444', emoji: '⚠️', badge: 'Low',           text: '#EF4444' },
  LOW_WARNING:   { color: '#F97316', bg: 'rgba(249,115,22,0.10)', border: '#F97316', emoji: '📉', badge: 'Low Warning',   text: '#F97316' },
  NORMAL:        { color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: '#10B981', emoji: '✅', badge: 'Normal',        text: '#10B981' },
  HIGH_WARNING:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: '#F59E0B', emoji: '📈', badge: 'High Warning',  text: '#F59E0B' },
  HIGH:          { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',  border: '#EF4444', emoji: '⚠️', badge: 'High',          text: '#EF4444' },
  CRITICAL_HIGH: { color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', border: '#7C3AED', emoji: '🚨', badge: 'Critical High', text: '#7C3AED' },
};

const PRIORITY_BADGE = {
  NONE:      { label: 'No Action',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ROUTINE:   { label: 'Routine Follow-up', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  URGENT:    { label: 'Urgent',         cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  IMMEDIATE: { label: 'Immediate Care', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const TYPE_CONFIG = {
  SUGAR: { label: 'Blood Sugar', icon: Droplets, unit: 'mg/dL', color: '#3B82F6', bg: '#EFF6FF', fields: ['sugar'] },
  CHOLESTEROL: { label: 'Cholesterol', icon: Activity, unit: 'mg/dL', color: '#8B5CF6', bg: '#F5F3FF', fields: ['cholesterol'] },
  BLOOD_PRESSURE: { label: 'Blood Pressure', icon: Heart, unit: 'mmHg', color: '#EF4444', bg: '#FEF2F2', fields: ['systolic', 'diastolic'] },
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

// ─── Mini spark bar ───────────────────────────────────────────────────────────
function SparkBar({ reports, type }) {
  if (!reports || reports.length < 2) return null;
  const vals = reports.slice(0, 8).reverse().map(r =>
    type === 'SUGAR' ? r.value?.sugar :
    type === 'CHOLESTEROL' ? r.value?.cholesterol :
    r.value?.bp?.systolic
  ).filter(Boolean);
  if (!vals.length) return null;
  const max = Math.max(...vals), min = Math.min(...vals);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-0.5 h-8">
      {vals.map((v, i) => (
        <div key={i}
          style={{ height: `${Math.max(15, ((v - min) / range) * 100)}%`, background: TYPE_CONFIG[type]?.color, opacity: 0.6 + (i / vals.length) * 0.4 }}
          className="w-2 rounded-t transition-all"
        />
      ))}
    </div>
  );
}

// ─── Analysis card ────────────────────────────────────────────────────────────
function AnalysisCard({ analysis, onClose }) {
  if (!analysis) return null;
  const meta = LEVEL_META[analysis.level] || LEVEL_META.NORMAL;
  const priority = PRIORITY_BADGE[analysis.alertPriority] || PRIORITY_BADGE.NONE;
  return (
    <div className="rounded-2xl border-2 overflow-hidden animate-fadeIn"
      style={{ borderColor: meta.border, background: meta.bg }}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Analysis Result</p>
              <h3 className="text-xl font-bold" style={{ color: meta.text }}>{analysis.label}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${priority.cls}`}>{priority.label}</span>
            {onClose && (
              <button onClick={onClose} className="p-1 rounded-full hover:bg-white/60 transition">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-4">{analysis.message}</p>

        {/* Parameters */}
        {analysis.parameters?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {analysis.parameters.map((p, i) => {
              const pm = LEVEL_META[p.status] || LEVEL_META.NORMAL;
              return (
                <div key={i} className="bg-white/70 rounded-xl p-3 border border-white/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">{p.name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: pm.bg, color: pm.text }}>{pm.badge}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">{p.value}</span>
                    <span className="text-sm text-gray-500">{p.unit}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Normal: {p.normalRange}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Advice */}
        <div className="rounded-xl border border-white/80 bg-white/60 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Clinical Advice
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{analysis.advice}</p>
        </div>

        {analysis.requiresDoctor && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            This reading requires a doctor consultation.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History item ─────────────────────────────────────────────────────────────
function HistoryItem({ report }) {
  const [expanded, setExpanded] = useState(false);
  const meta = LEVEL_META[report.classification] || LEVEL_META.NORMAL;
  const cfg = TYPE_CONFIG[report.type];

  const displayValue = () => {
    if (report.type === 'SUGAR') return `${report.value?.sugar} mg/dL`;
    if (report.type === 'CHOLESTEROL') return `${report.value?.cholesterol} mg/dL`;
    if (report.type === 'BLOOD_PRESSURE') return `${report.value?.bp?.systolic}/${report.value?.bp?.diastolic} mmHg`;
    return '-';
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
          {cfg && <cfg.icon className="w-5 h-5" style={{ color: meta.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-gray-800 text-sm">{cfg?.label}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.text }}>{meta.badge}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(report.measuredAt || report.createdAt)}</span>
            <span>{formatTime(report.measuredAt || report.createdAt)}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-gray-900">{displayValue()}</p>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto mt-1" />}
        </div>
      </button>

      {expanded && report.analysis && (
        <div className="px-5 pb-5">
          <AnalysisCard analysis={report.analysis} />
        </div>
      )}
    </div>
  );
}

// ─── Reference ranges modal ───────────────────────────────────────────────────
function ReferenceModal({ ranges, onClose }) {
  if (!ranges) return null;
  const ACTION_COLOR = { NONE: '#10B981', ROUTINE: '#F59E0B', URGENT: '#EF4444', IMMEDIATE: '#7C3AED' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-7 py-5 border-b flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Clinical Reference Ranges</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-7 space-y-8">
          {Object.entries(ranges).map(([type, data]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                {type === 'SUGAR' && <Droplets className="w-5 h-5 text-blue-500" />}
                {type === 'CHOLESTEROL' && <Activity className="w-5 h-5 text-purple-500" />}
                {type === 'BLOOD_PRESSURE' && <Heart className="w-5 h-5 text-red-500" />}
                <h3 className="font-bold text-gray-800">{TYPE_CONFIG[type]?.label}</h3>
                <span className="text-xs text-gray-400 ml-1">({data.unit})</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Level</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Range</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Label</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ranges.map((r, i) => {
                      const m = LEVEL_META[r.level] || LEVEL_META.NORMAL;
                      return (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.text }}>{m.badge}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-gray-700">{r.range}</td>
                          <td className="px-4 py-3 text-gray-700">{r.label}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold" style={{ color: ACTION_COLOR[r.action] || '#6B7280' }}>{r.action}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
const HealthReports = () => {
  const patientId = getPatientId();

  // Form state
  const [formType, setFormType] = useState('SUGAR');
  const [formValues, setFormValues] = useState({ sugar: '', cholesterol: '', systolic: '', diastolic: '' });
  const [submitting, setSubmitting] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [formError, setFormError] = useState('');

  // Data state
  const [reports, setReports] = useState([]);
  const [latestMetrics, setLatestMetrics] = useState([]);
  const [refRanges, setRefRanges] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRef, setShowRef] = useState(false);

  // Filter
  const [filterType, setFilterType] = useState('ALL');

  // Fetch history
  const fetchReports = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`${API}/patient/${patientId}/health-reports`, { headers: authHeaders() });
      const json = await res.json();
      if (json.ok) setReports(json.data || []);
    } catch (e) { console.error(e); }
  }, [patientId]);

  // Fetch latest per type
  const fetchLatest = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`${API}/patient/${patientId}/health-reports?latest=true`, { headers: authHeaders() });
      const json = await res.json();
      if (json.ok) setLatestMetrics(json.data || []);
    } catch (e) { console.error(e); }
  }, [patientId]);

  // Fetch reference ranges
  const fetchRef = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`${API}/patient/${patientId}/health-reports/reference`, { headers: authHeaders() });
      const json = await res.json();
      if (json.ok) setRefRanges(json.data);
    } catch (e) { console.error(e); }
  }, [patientId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchReports(), fetchLatest(), fetchRef()]);
      setLoading(false);
    };
    load();
  }, [fetchReports, fetchLatest, fetchRef]);

  // Submit new report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!patientId) { setFormError('Patient not authenticated.'); return; }

    let value = {};
    let unit = '';
    if (formType === 'SUGAR') {
      if (!formValues.sugar) { setFormError('Please enter blood sugar value.'); return; }
      value = { sugar: parseFloat(formValues.sugar) };
      unit = 'mg/dL';
    } else if (formType === 'CHOLESTEROL') {
      if (!formValues.cholesterol) { setFormError('Please enter cholesterol value.'); return; }
      value = { cholesterol: parseFloat(formValues.cholesterol) };
      unit = 'mg/dL';
    } else if (formType === 'BLOOD_PRESSURE') {
      if (!formValues.systolic || !formValues.diastolic) { setFormError('Please enter both systolic and diastolic values.'); return; }
      value = { bp: { systolic: parseFloat(formValues.systolic), diastolic: parseFloat(formValues.diastolic) } };
      unit = 'mmHg';
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/patient/${patientId}/health-reports`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ type: formType, value, unit }),
      });
      const json = await res.json();
      if (json.ok) {
        setLatestAnalysis(json.data.analysis);
        setFormValues({ sugar: '', cholesterol: '', systolic: '', diastolic: '' });
        await fetchReports();
        await fetchLatest();
      } else {
        setFormError(json.message || 'Failed to submit report.');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = filterType === 'ALL' ? reports : reports.filter(r => r.type === filterType);

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading health data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #eff6ff 100%)' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out forwards; }
      `}</style>

      <div className="max-w-6xl mx-auto p-6 pb-16">

        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">🩺</span> Health Monitor
            </h1>
            <p className="text-gray-500 mt-1">Track and analyse your key health metrics with clinical precision</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => { setLoading(true); await Promise.all([fetchReports(), fetchLatest()]); setLoading(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-emerald-400 hover:text-emerald-600 text-sm font-medium transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => setShowRef(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm"
            >
              <BookOpen className="w-4 h-4" /> Reference Ranges
            </button>
          </div>
        </div>

        {/* ─── Latest metrics summary ──────────────────────────────────────── */}
        {latestMetrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {Object.keys(TYPE_CONFIG).map(type => {
              const latest = latestMetrics.find(r => r.type === type);
              const cfg = TYPE_CONFIG[type];
              const meta = latest ? (LEVEL_META[latest.classification] || LEVEL_META.NORMAL) : null;
              const val = latest
                ? (type === 'BLOOD_PRESSURE'
                    ? `${latest.value?.bp?.systolic}/${latest.value?.bp?.diastolic}`
                    : (type === 'SUGAR' ? latest.value?.sugar : latest.value?.cholesterol))
                : null;
              const typeReports = reports.filter(r => r.type === type);

              return (
                <div key={type} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.bg }}>
                        <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{cfg.label}</p>
                    </div>
                    {meta && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.text }}>{meta.badge}</span>}
                  </div>
                  {latest ? (
                    <>
                      <p className="text-3xl font-extrabold text-gray-900 mb-0.5">
                        {val} <span className="text-base font-medium text-gray-400">{cfg.unit}</span>
                      </p>
                      <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(latest.measuredAt || latest.createdAt)}
                      </p>
                      <SparkBar reports={typeReports} type={type} />
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-300 text-4xl mb-1">—</p>
                      <p className="text-xs text-gray-400">No reading yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ─── Log new reading form ──────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden sticky top-4">
              <div className="px-6 pt-6 pb-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-gray-900">Log New Reading</h2>
                </div>
                <p className="text-xs text-gray-500">Auto-analysed using WHO/ADA/AHA 2023 standards</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Metric Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Metric Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <button type="button" key={key} onClick={() => { setFormType(key); setLatestAnalysis(null); setFormError(''); }}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all"
                        style={formType === key
                          ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color }
                          : { borderColor: '#E5E7EB', background: 'white', color: '#6B7280' }}>
                        <cfg.icon className="w-5 h-5" />
                        <span className="leading-tight text-center">{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-3">
                  {formType === 'SUGAR' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Fasting Blood Glucose (mg/dL)</label>
                      <input type="number" placeholder="e.g. 92" value={formValues.sugar} min="1" max="600" step="0.1"
                        onChange={e => setFormValues(p => ({ ...p, sugar: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm font-medium transition-colors" />
                    </div>
                  )}
                  {formType === 'CHOLESTEROL' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Total Cholesterol (mg/dL)</label>
                      <input type="number" placeholder="e.g. 190" value={formValues.cholesterol} min="1" max="700" step="0.1"
                        onChange={e => setFormValues(p => ({ ...p, cholesterol: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm font-medium transition-colors" />
                    </div>
                  )}
                  {formType === 'BLOOD_PRESSURE' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Systolic Pressure (mmHg)</label>
                        <input type="number" placeholder="e.g. 118" value={formValues.systolic} min="1" max="300" step="1"
                          onChange={e => setFormValues(p => ({ ...p, systolic: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:outline-none text-sm font-medium transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Diastolic Pressure (mmHg)</label>
                        <input type="number" placeholder="e.g. 76" value={formValues.diastolic} min="1" max="200" step="1"
                          onChange={e => setFormValues(p => ({ ...p, diastolic: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 focus:outline-none text-sm font-medium transition-colors" />
                      </div>
                    </div>
                  )}
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {formError}
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60"
                  style={{ background: submitting ? '#9CA3AF' : 'linear-gradient(135deg, #059669, #0d9488)', color: 'white' }}>
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analysing…</>
                  ) : (
                    <><Zap className="w-4 h-4" />Analyse & Submit</>
                  )}
                </button>

                {/* Inline result */}
                {latestAnalysis && !submitting && (
                  <div className="animate-fadeIn">
                    <AnalysisCard analysis={latestAnalysis} onClose={() => setLatestAnalysis(null)} />
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* ─── History ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <BarChart2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-600 mr-1">Filter:</span>
              {['ALL', 'SUGAR', 'CHOLESTEROL', 'BLOOD_PRESSURE'].map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                  style={filterType === t
                    ? { background: '#059669', color: 'white', borderColor: '#059669' }
                    : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }}>
                  {t === 'ALL' ? 'All' : TYPE_CONFIG[t]?.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400">{filteredReports.length} record{filteredReports.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Records */}
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No readings yet</h3>
                <p className="text-gray-400 text-sm mb-6">Log your first health metric using the form on the left.</p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium">
                  <ArrowRight className="w-4 h-4" /> Start by selecting a metric type
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReports.map(report => (
                  <HistoryItem key={report._id} report={report} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reference Ranges Modal */}
      {showRef && refRanges && <ReferenceModal ranges={refRanges} onClose={() => setShowRef(false)} />}
    </div>
  );
};

export default HealthReports;
