import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BrowseDoctors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const navigate = useNavigate();

  // Fetch doctors from backend
  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build URL with query params
      let url = 'http://localhost:5000/api/doctors';
      if (selectedSpecialty) {
        url += `?specialty=${encodeURIComponent(selectedSpecialty)}`;
      }
      
      const response = await axios.get(url);
      
      if (response.data.success) {
        setDoctors(response.data.data);
        extractSpecialties(response.data.data);
      } else {
        setError('Failed to fetch doctors');
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.response?.data?.message || 'Error loading doctors');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique specialties for filter dropdown
  const extractSpecialties = (doctorsList) => {
    const uniqueSpecialties = [...new Set(doctorsList.map(doc => doc.specialization))];
    setSpecialties(uniqueSpecialties);
  };

  // Filter doctors based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDoctors(filtered);
    }
  }, [searchTerm, doctors]);

  // Handle specialty filter change
  const handleSpecialtyChange = (specialty) => {
    setSelectedSpecialty(specialty === selectedSpecialty ? '' : specialty);
  };

  // In BrowseDoctors.jsx
const handleBookAppointment = (doctor) => {
  const patientToken = localStorage.getItem('patientToken');
  
  if (!patientToken) {
    navigate('/patient/login', { 
      state: { 
        from: '/patient/dashboard', 
        doctorId: doctor._id,
        doctor 
      } 
    });
    return;
  }

  // Navigate with doctor data - remove the doctorId param since we're using state
  navigate('/patient/dashboard', { 
    state: { 
      preSelectedDoctor: doctor,
      openBookAppointment: true  // Add flag to trigger booking page
    } 
  });
};


  // Handle view profile
  const handleViewProfile = (doctorId) => {
    navigate(`/doctor-profile/${doctorId}`);
  };

  // Get avatar placeholder based on doctor name
  const getAvatar = (name) => {
    const initial = name?.charAt(0) || '👨‍⚕️';
    return initial;
  };

  // Format experience display
  const formatExperience = (years) => {
    return `${years} ${years === 1 ? 'year' : 'years'} experience`;
  };

  if (loading) {
    return (
      <div className="h-full bg-white rounded-3xl shadow-inner p-6 overflow-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-white rounded-3xl shadow-inner p-6 overflow-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-600 text-center">
            <p className="text-lg font-semibold mb-2">Error</p>
            <p>{error}</p>
            <button 
              onClick={fetchDoctors}
              className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-3xl hover:bg-emerald-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-3xl shadow-inner p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">Browse Doctors</h1>
        
        <div className="flex items-center gap-x-4 flex-wrap gap-2">
          {/* Search Bar */}
          <div className="relative w-80">
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 border border-transparent focus:border-emerald-300 rounded-3xl py-3 pl-10 pr-4 text-sm outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          </div>

          {/* Specialty Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => document.getElementById('specialtyDropdown').classList.toggle('hidden')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-3xl font-medium flex items-center gap-x-2 transition-colors"
            >
              <span className="text-xl">🔄</span>
              {selectedSpecialty || 'All Specialties'}
              <span className="ml-2">▼</span>
            </button>
            
            <div 
              id="specialtyDropdown"
              className="hidden absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 z-10 max-h-80 overflow-y-auto"
            >
              <div className="p-2">
                <button
                  onClick={() => {
                    handleSpecialtyChange('');
                    document.getElementById('specialtyDropdown').classList.add('hidden');
                  }}
                  className={`w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors ${
                    !selectedSpecialty ? 'bg-emerald-50 text-emerald-600 font-medium' : ''
                  }`}
                >
                  All Specialties
                </button>
                {specialties.map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => {
                      handleSpecialtyChange(specialty);
                      document.getElementById('specialtyDropdown').classList.add('hidden');
                    }}
                    className={`w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors ${
                      selectedSpecialty === specialty ? 'bg-emerald-50 text-emerald-600 font-medium' : ''
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-500">
        Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No doctors found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecialty('');
            }}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                {/* Avatar */}
                <div className="w-20 h-20 bg-emerald-100 text-4xl flex items-center justify-center rounded-3xl shadow-inner">
                  {getAvatar(doctor.name)}
                </div>

                {/* Doctor Code */}
                <div className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-3xl">
                  {doctor.doctorCode || `DOC${doctor._id?.slice(-6).toUpperCase()}`}
                </div>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-gray-900">{doctor.name}</h3>
              <p className="text-emerald-600 font-medium">{doctor.specialization}</p>

              <div className="mt-4 text-sm text-gray-500 space-y-1">
                <p>🎓 {doctor.qualification}</p>
                <p>📍 {doctor.hospital}</p>
                <p>🩺 {formatExperience(doctor.experience)}</p>
                <p>📞 {doctor.phoneNumber}</p>
              </div>

              {/* Bio (if available) */}
              {doctor.bio && (
                <p className="mt-3 text-xs text-gray-400 line-clamp-2">{doctor.bio}</p>
              )}

              {/* Social Icons */}
              <div className="flex gap-x-4 mt-6">
                <span className="text-xl cursor-pointer hover:scale-110 transition-transform">📘</span>
                <span className="text-xl cursor-pointer hover:scale-110 transition-transform">📸</span>
                <span className="text-xl cursor-pointer hover:scale-110 transition-transform">𝕏</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-x-3 mt-8">
                <button
                  onClick={() => handleBookAppointment(doctor)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-3xl font-medium transition-colors"
                >
                  Book Appointment
                </button>
                <button 
                  onClick={() => handleViewProfile(doctor._id)}
                  className="flex-1 border border-gray-300 hover:bg-gray-100 py-3.5 rounded-3xl font-medium transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseDoctors;