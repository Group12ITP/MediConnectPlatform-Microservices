import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EMAIL_REGEX,
  PHONE_REGEX,
  STRONG_PASSWORD_REGEX,
  isAdultDate,
} from '../../utils/formValidation';

const PatientRegister = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(formData.email.trim())) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (!STRONG_PASSWORD_REGEX.test(formData.password)) newErrors.password = 'Use 8+ chars with uppercase, lowercase, and number';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!PHONE_REGEX.test(formData.phoneNumber.trim())) newErrors.phoneNumber = 'Please enter a valid phone number';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    else if (!isAdultDate(formData.dateOfBirth)) newErrors.dateOfBirth = 'Age must be at least 12 years';

    setErrors(newErrors);
    setApiError('');
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API_URL}/patient/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phoneNumber: formData.phoneNumber.trim(),
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      if (data.success) {
        localStorage.setItem('patientToken', data.token);
        localStorage.setItem('patientInfo', JSON.stringify(data.patient));
        localStorage.setItem('lastRole', 'patient');
        if (onLoginSuccess) onLoginSuccess();
        navigate('/patient/dashboard');
      } else {
        setApiError(data.message || 'Registration failed');
      }
    } catch (err) {
      setApiError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[1200px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative z-10 animate-fadeInUp">
        {/* LEFT SIDE - Illustration + Greeting */}
        <div className="hidden lg:flex bg-gradient-to-br from-emerald-700 to-teal-700 p-12 flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="text-center lg:text-left">
              <h1 className="text-7xl font-bold text-white leading-none mb-4 animate-slideInLeft">
                CREATE
                <br />
                ACCOUNT
              </h1>
              <p className="text-xl text-white/90 mt-3">
                Join <span className="font-bold text-white">MediConnect</span>
                <br />
                and manage your health digitally
              </p>
            </div>

            <div className="mt-12 ml-25 flex justify-center lg:justify-start">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-72 h-72 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center text-[160px] border-4 border-white/30 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  🧑‍🦰
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-white/80">Access</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-white">Secure</p>
                <p className="text-sm text-white/80">Records</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Register Form */}
        <div className="p-6 sm:p-8 lg:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center gap-3 mb-10 animate-slideInRight">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg transform rotate-3">
                🧬
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  MediConnect
                </span>
                <span className="block text-xs text-emerald-600 -mt-1 tracking-widest font-semibold">
                  PATIENT PORTAL
                </span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-500 mb-8">Enter your details to get started</p>

            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-600 text-sm font-medium">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className={`w-full border-2 rounded-2xl px-5 py-3.5 outline-none transition-all text-gray-800 placeholder-gray-400 ${
                    errors.name ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-100'
                  }`}
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1 ml-2">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className={`w-full border-2 rounded-2xl px-5 py-3.5 outline-none transition-all text-gray-800 placeholder-gray-400 ${
                    errors.email ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-100'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 ml-2">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    className={`w-full border-2 rounded-2xl px-5 py-3.5 pr-12 outline-none transition-all text-gray-800 placeholder-gray-400 ${
                      errors.password ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-100'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1 ml-2">{errors.password}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, phoneNumber: e.target.value }))}
                    className={`w-full border-2 rounded-2xl px-5 py-3.5 outline-none transition-all text-gray-800 placeholder-gray-400 ${
                      errors.phoneNumber ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-100'
                    }`}
                    placeholder="07xxxxxxxx"
                  />
                  {errors.phoneNumber && <p className="text-xs text-red-500 mt-1 ml-2">{errors.phoneNumber}</p>}
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    className={`w-full border-2 rounded-2xl px-5 py-3.5 outline-none transition-all text-gray-800 placeholder-gray-400 ${
                      errors.dateOfBirth ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-100'
                    }`}
                  />
                  {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1 ml-2">{errors.dateOfBirth}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                    className="w-full border-2 border-gray-200 focus:border-emerald-400 rounded-2xl px-5 py-3.5 outline-none transition-all"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Blood group */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Group (optional)</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData((p) => ({ ...p, bloodGroup: e.target.value }))}
                    className="w-full border-2 border-gray-200 focus:border-emerald-400 rounded-2xl px-5 py-3.5 outline-none transition-all"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-2xl text-lg font-semibold transition-all transform hover:scale-[1.02] shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center space-y-2">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/patient/login')}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-all"
                >
                  Sign in
                </button>
              </p>
              <p className="text-gray-500 text-sm">
                Are you a doctor?{' '}
                <button
                  onClick={() => navigate('/doctor/login')}
                  className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-all"
                >
                  Doctor Portal
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.6s ease-out; }
        .delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </div>
  );
};

export default PatientRegister;
