import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EMAIL_REGEX, PHONE_REGEX, STRONG_PASSWORD_REGEX } from '../../utils/formValidation';

const DoctorRegister = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    experience: '',
    hospital: '',
    location: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bio: '',
    licenseNumber: '',
    consultationFee: '',
    qualification: '',
  });

  const [agreed, setAgreed] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const specialties = [
    "Cardiology", "Dermatology", "Neurology", "Pediatrics",
    "Orthopedics", "Ophthalmology", "Psychiatry",
    "Radiology", "Surgery", "Internal Medicine",
    "Emergency Medicine", "Family Medicine", "Other"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Full name is required';
    if (!formData.specialty) newErrors.specialty = 'Specialty is required';
    if (!formData.experience) newErrors.experience = 'Years of experience is required';
    if (formData.experience && (isNaN(formData.experience) || formData.experience < 0)) {
      newErrors.experience = 'Please enter a valid number';
    }
    if (!formData.hospital) newErrors.hospital = 'Hospital/Clinic is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!PHONE_REGEX.test(formData.phone.trim())) newErrors.phone = 'Please enter a valid phone number';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!STRONG_PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = 'Use 8+ chars with uppercase, lowercase, and number';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.licenseNumber) newErrors.licenseNumber = 'Medical license number is required';
    if (!formData.qualification) newErrors.qualification = 'Qualification is required';
    if (!agreed) newErrors.agreed = 'Please accept the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        specialization: formData.specialty,
        licenseNumber: formData.licenseNumber,
        qualification: formData.qualification,
        experience: parseInt(formData.experience),
        hospital: formData.hospital,
        phoneNumber: formData.phone,
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success) {
        localStorage.setItem('doctorToken', data.token);
        localStorage.setItem('doctorInfo', JSON.stringify(data.doctor));
        if (onLoginSuccess) onLoginSuccess();
        setRegistered(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setApiError(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/doctor/dashboard');
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-12 text-center animate-scaleIn relative z-10">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-teal-400 to-teal-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-6xl">🎉</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Registration Successful!
          </h1>
          <p className="text-gray-600 mt-4">Welcome to HealthAI Doctor Portal</p>
          <button
            onClick={handleGoToDashboard}
            className="mt-8 w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-10 py-4 rounded-2xl font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-[1200px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative z-10 animate-fadeInUp">
        {/* LEFT SIDE - Same as before */}
        <div className="hidden lg:flex bg-gradient-to-br from-teal-600 to-cyan-700 p-12 flex-col justify-center relative overflow-hidden">
          {/* ... (your original left side JSX - unchanged) */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">👨‍⚕️</span>
              <span className="text-white font-medium">Join Our Network</span>
            </div>
            
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-bold text-white leading-tight mb-4 animate-slideInLeft">
                Join Our<br />Medical Network!
              </h1>
              <p className="text-xl text-white/90 mt-3">Become a verified doctor on</p>
              <p className="text-4xl font-bold text-white mt-2 animate-slideInLeft">HealthAI</p>
            </div>

            <div className="mt-12 space-y-3">
              <div className="flex items-center gap-3 text-white/90">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>Help thousands of patients</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>Manage your schedule easily</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>Issue digital prescriptions</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>Conduct video consultations</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-white">12K+</p>
                <p className="text-sm text-white/80">Active Doctors</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-white">50K+</p>
                <p className="text-sm text-white/80">Monthly Patients</p>
              </div>
            </div>

            <div className="mt-12 ml-30 flex justify-center lg:justify-start">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-56 h-56 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center text-[120px] border-4 border-white/30 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  👨‍⚕️
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Registration Form */}
        <div className="p-6 sm:p-8 lg:p-12 flex flex-col bg-white max-h-[150vh] overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center gap-3 mb-8 animate-slideInRight">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg transform rotate-3">🧬</div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">HealthAI</span>
                <span className="block text-xs text-teal-600 -mt-1 tracking-widest font-semibold">DOCTOR PORTAL</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Doctor Account</h2>
            <p className="text-gray-500 mb-6">Join our network of healthcare professionals</p>

            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-600 text-sm font-medium">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name and Specialty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Dr. Kanchana Silva" 
                    className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.name ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Specialty</label>
                  <select name="specialty" value={formData.specialty} onChange={handleChange}
                    className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.specialty ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`}>
                    <option value="">Select Specialty</option>
                    {specialties.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                  </select>
                  {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty}</p>}
                </div>
              </div>

              {/* Experience and License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
                  <input type="number" name="experience" value={formData.experience} onChange={handleChange} placeholder="12"
                    className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.experience ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                  {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Medical License #</label>
                  <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="SLMC-12345"
                    className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.licenseNumber ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                  {errors.licenseNumber && <p className="text-xs text-red-500 mt-1">{errors.licenseNumber}</p>}
                </div>
              </div>

              {/* Qualification (New - required by backend) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Qualification (e.g. MBBS, MD Cardiology)</label>
                <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="MBBS, MD in Cardiology"
                  className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.qualification ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                {errors.qualification && <p className="text-xs text-red-500 mt-1">{errors.qualification}</p>}
              </div>

              {/* Hospital and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital / Clinic</label>
                  <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} placeholder="Kandy General Hospital"
                    className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.hospital ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                  {errors.hospital && <p className="text-xs text-red-500 mt-1">{errors.hospital}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Kandy, Sri Lanka"
                    className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.location ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                  {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                </div>
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="dr.kanchana@healthai.lk"
                    className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.email ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+94 77 123 4567"
                    className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.phone ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Consultation Fee (Optional - not sent to backend) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation Fee (LKR) - Optional</label>
                <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} placeholder="2500"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-teal-400 transition-all" />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                      className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.password ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-500">
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      className={`w-full border-2 rounded-xl px-4 py-3 outline-none transition-all ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400'}`} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-500">
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">About Me / Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-teal-400 transition-all resize-none"
                  placeholder="Brief professional bio, qualifications, achievements..." />
              </div>

              {/* Terms */}
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 accent-teal-600 rounded" />
                <label htmlFor="terms" className="text-gray-600">
                  I agree to the <span className="text-teal-600 font-semibold hover:underline cursor-pointer">Terms & Conditions</span>
                </label>
              </div>
              {errors.agreed && <p className="text-xs text-red-500">{errors.agreed}</p>}

              <button type="submit" disabled={isLoading}
                className="relative w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-teal-200 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : "Register as Doctor"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">Already have an account?</span>{' '}
              <button onClick={() => navigate('/doctor/login')} className="text-teal-600 font-semibold hover:underline transition-all">
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.6s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.6s ease-out; }
        .delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </div>
  );
};

export default DoctorRegister;