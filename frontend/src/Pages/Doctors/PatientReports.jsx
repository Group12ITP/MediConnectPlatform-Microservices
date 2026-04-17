import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const headers = () => {
  const token = localStorage.getItem('doctorToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const authHeaders = () => {
  const token = localStorage.getItem('doctorToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PatientReports = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const patientId = (p) => (p && (p._id ?? p.id)) || null;

  // Fetch doctor's patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${API}/doctors/me/patients`, { headers: headers() });
        const json = await res.json();
        if (json.success) setPatients(json.data);
      } catch (err) {
        console.error('Failed to load patients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Fetch reports for the selected patient
  useEffect(() => {
    if (!selectedPatient) return;
    const id = patientId(selectedPatient);
    if (!id) return;

    const fetchReports = async () => {
      setReportsLoading(true);
      setReportsError(null);
      setReports([]);
      try {
        const res = await fetch(`${API}/reports/patient/${id}`, { headers: headers() });
        const json = await res.json();
        if (res.status === 403) {
          setReportsError(json.message || 'You do not have access to this patient\'s reports.');
          return;
        }
        if (json.success) setReports(json.data || []);
        else setReportsError(json.message || 'Could not load reports');
      } catch (err) {
        console.error('Failed to load reports', err);
        setReportsError('Failed to load reports');
      } finally {
        setReportsLoading(false);
      }
    };
    fetchReports();
  }, [selectedPatient]);

  const getFileIcon = (category) => {
    if (category?.includes("Imaging")) return "🩻";
    if (category?.includes("Blood")) return "🩸";
    if (category?.includes("Prescription")) return "💊";
    return "📁";
  };

  const getFileColor = (idx) => {
    const colors = ["bg-red-100 text-red-600", "bg-blue-100 text-blue-600", "bg-green-100 text-green-600", "bg-purple-100 text-purple-600"];
    return colors[idx % colors.length];
  };

  const handleDownloadReport = async (report) => {
    setDownloadingId(report._id);
    try {
      const res = await fetch(`${API}/reports/${report._id}/download`, { headers: authHeaders() });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        if (res.status === 403) throw new Error('You do not have permission to download this report.');
        if (res.status === 404) throw new Error('File not found on server. It may have been deleted.');
        throw new Error('Failed to download the report.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.originalName || 'report';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Download failed: ${e.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter((report) => {
    if (filterType === 'all') return true;
    const cat = report.category || 'Other';
    return cat === filterType;
  });

  const categories = ['all', ...new Set(reports.map((r) => r.category || 'Other'))];

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-teal-50/30 rounded-3xl p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Patient Reports
            </h1>
            <p className="text-gray-500 mt-1">Access and manage medical reports and documents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Patient List Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-8 border border-gray-100">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <h3 className="text-xl font-semibold">Patient List</h3>
                </div>
                <p className="text-teal-100 text-sm mt-1">Select a patient to view reports</p>
              </div>

              <div className="p-4 border-b">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-teal-400"
                />
              </div>

              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <p className="text-center text-gray-400 py-4">Loading patients...</p>
                ) : filteredPatients.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No patients found.</p>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patientId(patient) || patient.email}
                      onClick={() => { setSelectedPatient(patient); setFilterType('all'); }}
                      className={`cursor-pointer transition-all duration-300 rounded-2xl p-4 ${
                        patientId(selectedPatient) === patientId(patient)
                          ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                          : 'bg-gray-50 hover:bg-teal-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">👤</div>
                        <div>
                          <p className={`font-semibold ${patientId(selectedPatient) === patientId(patient) ? 'text-white' : 'text-gray-800'}`}>
                            {patient.name}
                          </p>
                          <p className={`text-xs ${patientId(selectedPatient) === patientId(patient) ? 'text-teal-100' : 'text-gray-500'}`}>
                            {patient.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Reports Area */}
          <div className="lg:col-span-8">
            {selectedPatient ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-center bg-gradient-to-r from-teal-50 to-blue-50">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">👤</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.name}</h2>
                      <p className="text-sm text-gray-600">
                        {reportsLoading ? 'Loading documents…' : `${reports.length} documents uploaded`}
                      </p>
                    </div>
                  </div>
                </div>

                {reportsError && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">{reportsError}</div>
                )}

                {!reportsLoading && !reportsError && reports.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setFilterType(category)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all capitalize ${
                          filterType === category
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category === 'all' ? 'All Reports' : category}
                      </button>
                    ))}
                  </div>
                )}

                {reportsLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                  </div>
                ) : reports.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredReports.map((report, idx) => (
                      <div key={report._id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getFileColor(idx)}`}>
                            {getFileIcon(report.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate" title={report.originalName}>{report.originalName}</p>
                            <p className="text-xs text-gray-500 mt-1">{report.category || 'Other'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Uploaded:{' '}
                              {new Date(report.createdAt || report.uploadDate).toLocaleDateString()}
                            </p>
                            <button
                              onClick={() => handleDownloadReport(report)}
                              disabled={downloadingId === report._id}
                              className="mt-4 w-full py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {downloadingId === report._id ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Downloading...</>
                              ) : (
                                <>⬇ Download Report</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !reportsError ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="text-4xl mb-4">📂</div>
                    <p className="text-gray-500 font-medium">No reports found for this patient.</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-center">
                  <div className="text-6xl mb-4 text-gray-300">📋</div>
                  <p className="text-xl font-semibold text-gray-400">No Patient Selected</p>
                  <p className="text-gray-400 mt-2">Select a patient from the list to view their reports</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientReports;