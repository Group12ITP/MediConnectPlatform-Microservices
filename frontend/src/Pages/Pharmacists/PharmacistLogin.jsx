import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';
import { EMAIL_REGEX } from '../../utils/formValidation';

const PharmacistLogin = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [email, setEmail] = useState(() => localStorage.getItem('pharmacistEmail') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('pharmacistRemember') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email.trim())) newErrors.email = 'Please enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    setApiError('');
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${API_URL}/pharmacy/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      if (data.success) {
        localStorage.setItem('pharmacistToken', data.token);
        localStorage.setItem('pharmacistInfo', JSON.stringify(data.data));
        localStorage.setItem('lastRole', 'pharmacist');

        if (rememberMe) {
          localStorage.setItem('pharmacistEmail', email);
          localStorage.setItem('pharmacistRemember', 'true');
        } else {
          localStorage.removeItem('pharmacistEmail');
          localStorage.removeItem('pharmacistRemember');
        }

        if (onLoginSuccess) onLoginSuccess();
        navigate('/pharmacist/dashboard');
      } else {
        setApiError(data.message || 'Login failed');
      }
    } catch (err) {
      setApiError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20"><LanguageSwitcher variant="default" /></div>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[1200px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative z-10 animate-fadeInUp">
        {/* LEFT SIDE - Illustration + Greeting */}
        <div className="hidden lg:flex bg-gradient-to-br from-teal-600 to-cyan-700 p-12 flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="text-center lg:text-left">
              <h1 className="text-7xl font-bold text-white leading-none mb-4 animate-slideInLeft">
                {t('auth.welcomeBack').toUpperCase()}
              </h1>
              <p className="text-xl text-white/90 mt-3">
                {t('auth.loginToContinue')}
                <br />
                <span className="font-bold text-white">{t('nav.pharmacistPortal')}</span>
              </p>
            </div>

            <div className="mt-12 flex justify-center lg:justify-start">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-72 h-72 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center text-[160px] border-4 border-white/30 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  💊
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-white">Smart</p>
                <p className="text-sm text-white/80">Inventory</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-3xl font-bold text-white">Quick</p>
                <p className="text-sm text-white/80">Dispensing</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="p-6 sm:p-8 lg:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center gap-3 mb-10 animate-slideInRight">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg transform rotate-3">
                💊
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  HealthAI
                </span>
                <span className="block text-xs text-teal-600 -mt-1 tracking-widest font-semibold">
                  {t('nav.pharmacistPortal')}
                </span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.loginToContinue')}</h2>
            <p className="text-gray-500 mb-8">{t('auth.welcomeBack')}</p>

            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-600 text-sm font-medium">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.email')}</label>
                <input
                  type="email"
                  placeholder="pharmacist@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border-2 rounded-2xl px-5 py-4 outline-none transition-all text-gray-800 placeholder-gray-400 ${
                    errors.email ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400 focus:shadow-lg focus:shadow-teal-100'
                  }`}
                  required
                />
                {errors.email && <p className="text-xs text-red-500 mt-1 ml-4">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('common.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full border-2 rounded-2xl px-5 py-4 pr-12 outline-none transition-all text-gray-800 placeholder-gray-400 ${
                      errors.password ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-teal-400 focus:shadow-lg focus:shadow-teal-100'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1 ml-4">{errors.password}</p>}
              </div>

              {/* Remember Me & Create Account */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                  <span className="text-gray-600 group-hover:text-teal-600 transition-colors">{t('auth.rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/pharmacist/register')}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium hover:underline transition-all"
                >
                  {t('auth.createAccount')}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-4 rounded-2xl text-lg font-semibold transition-all transform hover:scale-[1.02] shadow-lg shadow-teal-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.processing')}
                  </div>
                ) : (
                  t('auth.signInPharmacist')
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                {t('auth.dontHaveAccount')}{' '}
                <button
                  onClick={() => navigate('/patient/login')}
                  className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-all"
                >
                  {t('nav.patientPortal')}
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

export default PharmacistLogin;