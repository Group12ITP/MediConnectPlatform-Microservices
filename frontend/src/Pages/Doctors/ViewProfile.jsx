import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctorProfile();
  }, [id]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/doctors/${id}`);
      
      if (response.data.success) {
        setDoctor(response.data.data);
      } else {
        setError('Doctor not found');
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      setError(err.response?.data?.message || 'Error loading doctor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    const patientToken = localStorage.getItem('patientToken');
    if (!patientToken) {
      navigate('/patient/login', { state: { from: `/doctor-profile/${id}`, doctorId: id } });
      return;
    }
    navigate(`/patient/book-appointment/${id}`, { state: { doctor } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Doctor not found'}</p>
          <button 
            onClick={() => navigate('/doctors')}
            className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-3xl"
          >
            Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
      >
        ← Back
      </button>

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-5xl backdrop-blur-sm">
              {doctor.name?.charAt(0) || '👨‍⚕️'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{doctor.name}</h1>
              <p className="text-emerald-100 text-lg mt-1">{doctor.specialization}</p>
              <p className="text-emerald-100 text-sm mt-2">{doctor.doctorCode || `DOC${doctor._id?.slice(-6).toUpperCase()}`}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Qualification</label>
                  <p className="text-gray-900 font-medium">{doctor.qualification}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Experience</label>
                  <p className="text-gray-900 font-medium">{doctor.experience} years</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Hospital/Clinic</label>
                  <p className="text-gray-900 font-medium">{doctor.hospital}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">License Number</label>
                  <p className="text-gray-900 font-medium">{doctor.licenseNumber}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Phone Number</label>
                  <p className="text-gray-900 font-medium">{doctor.phoneNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="text-gray-900 font-medium">{doctor.email}</p>
                </div>
              </div>

              {doctor.bio && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBookAppointment}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-3xl font-semibold transition-colors"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;