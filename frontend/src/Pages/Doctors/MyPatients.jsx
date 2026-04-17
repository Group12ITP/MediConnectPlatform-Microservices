import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const headers = () => {
  const token = localStorage.getItem('doctorToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const MyPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${API}/doctors/me/patients`, { headers: headers() });
        const json = await res.json();
        if (json.success) {
          setPatients(json.data);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Add status filter logic when status data is available
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (name) => {
    const colors = [
      'bg-gradient-to-br from-teal-400 to-teal-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-emerald-400 to-emerald-600',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const viewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedPatient(null);
  };

  const stats = {
    total: patients.length,
    new: patients.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    active: patients.length, // Replace with actual active count when available
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                  👥
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    My Patients
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">Manage and track your patient roster</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-400 mt-2">All time registered</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-2xl">
                📊
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">New Patients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.new}</p>
                <p className="text-xs text-green-600 mt-2">Last 30 days</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
                🆕
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Patients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-400 mt-2">With recent visits</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                ✅
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by patient name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 focus:border-teal-400 rounded-xl py-3 pl-12 pr-4 text-sm outline-none transition-all shadow-sm"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'all' 
                  ? 'bg-teal-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'active' 
                  ? 'bg-teal-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterStatus === 'inactive' 
                  ? 'bg-teal-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Patients List */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading patients...</p>
              <p className="text-gray-400 text-sm mt-1">Please wait while we fetch your data</p>
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Try adjusting your search criteria" : "Start by adding your first patient"}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className="px-6 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-all"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => navigate('/doctor/patients/add')}
                className="px-6 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-all"
              >
                + Add New Patient
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results count */}
            <div className="text-sm text-gray-500 mb-4">
              Showing {filteredPatients.length} of {patients.length} patients
            </div>
            
            {filteredPatients.map((patient) => (
              <div 
                key={patient._id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all duration-300"
              >
                <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-14 h-14 ${getRandomColor(patient.name)} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {getInitials(patient.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-gray-900">{patient.name}</h3>
                        {new Date(patient.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <span>📧</span> {patient.email}
                        </p>
                        {patient.contactNumber && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span>📱</span> {patient.contactNumber}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <span>📅</span> Joined {new Date(patient.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 self-end lg:self-center">
                    <button
                      onClick={() => viewPatientDetails(patient)}
                      className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors text-sm font-medium flex items-center gap-1"
                    >
                      <span>👁️</span>
                      <span>View Details</span>
                    </button>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${getRandomColor(selectedPatient.name)} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                  {getInitials(selectedPatient.name)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h2>
                  <p className="text-sm text-gray-500">Patient Details</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPatient.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPatient.email}</p>
                </div>
                {selectedPatient.contactNumber && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Contact Number</p>
                    <p className="text-sm font-medium text-gray-900">{selectedPatient.contactNumber}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedPatient.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              
              {selectedPatient.dateOfBirth && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {selectedPatient.address && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPatient.address}</p>
                </div>
              )}
              
              
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default MyPatients;