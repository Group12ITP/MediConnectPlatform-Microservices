import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useLocation , useNavigate} from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

const patientHeaders = () => {
  const token = localStorage.getItem('patientToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Specialty icons map ──────────────────────────────────────
const specialtyIcons = {
  'Cardiology': '❤️', 'Neurology': '🧠', 'Dermatology': '🧴',
  'Orthopedics': '🦴', 'Pediatrics': '👶', 'General Physician': '🩺',
  'Gynecology': '🌸', 'Ophthalmology': '👁️', 'ENT': '👂',
  'Psychiatry': '🧘', 'Dentistry': '🦷', 'Urology': '💊',
};

const BookAppointment = ({ preSelectedDoctor: propPreSelectedDoctor }) => {
  const [step, setStep] = useState(1);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState({});
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [toast, setToast] = useState(null);
  const { t } = useLanguage();

  const location = useLocation();
  const navigate = useNavigate();

   const preSelectedDoctor = propPreSelectedDoctor || location.state?.preSelectedDoctor;

  const progress = Math.round(((step - 1) / 3) * 100);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Build specialty list from doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await fetch(`${API}/appointments/doctors`);
        const json = await res.json();
        if (json.success) {
          setDoctors(json.data);
          const specs = [...new Set(json.data.map(d => d.specialization))].map((name, i) => ({
            id: i + 1,
            name,
            icon: specialtyIcons[name] || '🩺',
            count: json.data.filter(d => d.specialization === name).length,
          }));
          setSpecialties(specs);
        }
      } catch {
        showToast('error', 'Failed to load doctors. Using demo data.');
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (preSelectedDoctor && preSelectedDoctor._id && doctors.length > 0) {
      // Find the full doctor object from the loaded doctors list
      const fullDoctor = doctors.find(d => d._id === preSelectedDoctor._id) || preSelectedDoctor;
      
      setSelectedDoctor(fullDoctor);
      
      // Set specialty for consistency
      setSelectedSpecialty({
        name: fullDoctor.specialization,
        icon: specialtyIcons[fullDoctor.specialization] || '🩺'
      });

      // Load availability and jump directly to schedule step
      loadAvailability(fullDoctor);
      
      // Jump to Step 3
      setStep(3);
    }
  }, [preSelectedDoctor, doctors]);

  // Load availability when doctor selected
  const loadAvailability = async (doctor) => {
    setLoadingSlots(true);
    try {
      const now = new Date();
      const res = await fetch(
        `${API}/appointments/doctors/${doctor._id}/availability?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      );
      const json = await res.json();
      if (json.success) setAvailability(json.data);
    } catch {
      showToast('error', 'Could not load availability');
    } finally {
      setLoadingSlots(false);
    }
  };

  const filteredDoctors = selectedSpecialty
    ? doctors.filter(d => d.specialization === selectedSpecialty.name)
    : doctors;

  // Step 4: Create Stripe Checkout Session
  // In BookAppointment.jsx, find the handlePayment function and update it:

const handlePayment = async () => {
  const token = localStorage.getItem('patientToken');
  if (!token) {
    showToast('error', 'Please log in as a patient to book an appointment');
    return;
  }
  setLoading(true);
  try {
    const res = await fetch(`${API}/appointments/checkout-session`, {
      method: 'POST',
      headers: patientHeaders(),
      body: JSON.stringify({
        doctorId: selectedDoctor._id,
        date: selectedDate,
        time: selectedTime,
        specialty: selectedDoctor.specialization,
        reason: '',
        type: 'Video',
        fee: selectedDoctor.consultationFee || 2500,
        frontendUrl: window.location.origin, // ADD THIS LINE
      }),
    });
    const json = await res.json();
    if (json.success && json.data.url) {
      // Redirect to Stripe Checkout
      window.location.href = json.data.url;
    } else {
      showToast('error', json.message || 'Failed to initiate payment');
    }
  } catch {
    showToast('error', 'Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const ProgressSteps = () => (
    <div className="mb-12">
      <div className="flex justify-between mb-4">
        {[t('appointments.specialty'), t('appointments.doctor'), t('appointments.schedule'), t('appointments.payment')].map((label, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              step > idx + 1 ? 'bg-emerald-600 text-white' :
              step === idx + 1 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-100' :
              'bg-gray-100 text-gray-400'}`}>
              {step > idx + 1 ? '✓' : idx + 1}
            </div>
            <span className={`text-xs mt-2 font-medium ${step === idx + 1 ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>
          </div>
        ))}
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );

  // ── Step 1: Specialty ──────────────────────────────────────────
  if (step === 1) return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-3xl p-8 overflow-auto">
      {toast && <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{toast.message}</div>}
      <div className="max-w-6xl mx-auto">
        <ProgressSteps />
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl mb-6 shadow-lg"><span className="text-5xl">👨‍⚕️</span></div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">{t('appointments.findPerfectDoctor')}</h1>
          <p className="text-gray-500 text-lg">{t('appointments.selectSpecialty')}</p>
        </div>
        {loadingDoctors ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {specialties.map((spec) => (
              <button key={spec.id} onClick={() => { setSelectedSpecialty(spec); setStep(2); }}
                className="group relative bg-white rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-emerald-200">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{spec.icon}</div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">{spec.name}</h3>
                <p className="text-emerald-600 text-xs font-medium">{spec.count} {t('appointments.doctorsAvailable')}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Step 2: Doctor ─────────────────────────────────────────────
  if (step === 2) return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-3xl p-8 overflow-auto">
      {toast && <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{toast.message}</div>}
      <div className="max-w-7xl mx-auto">
        <ProgressSteps />
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl hover:border-emerald-400 hover:shadow-lg transition-all">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span className="font-medium">Back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('appointments.chooseYourDoctor')}</h1>
            <p className="text-gray-500 mt-1">{selectedSpecialty?.name} • {filteredDoctors.length} specialist{filteredDoctors.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} onClick={() => { setSelectedDoctor(doctor); loadAvailability(doctor); setStep(3); }}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-6">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl flex items-center justify-center text-5xl shadow-lg group-hover:scale-110 transition-transform duration-300">👨‍⚕️</div>
              </div>
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{doctor.name}</h3>
                <p className="text-emerald-600 font-medium text-sm">{doctor.specialization}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="text-gray-700">{doctor.experience || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Hospital</span><span className="text-gray-700 truncate ml-2">{doctor.hospital || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Fee</span><span className="font-bold text-emerald-600 text-lg">LKR {doctor.consultationFee || 2500}</span></div>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">Select Doctor →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Step 3: Schedule ───────────────────────────────────────────
  if (step === 3 && selectedDoctor) {
    // Filter dates to show only today and future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const allDates = Object.keys(availability).sort();
    const dates = allDates.filter(date => {
      const dateObj = new Date(date + 'T00:00:00');
      return dateObj >= today;
    });
    
    const selectedDateData = selectedDate ? availability[selectedDate] : null;
    const freeSlots = selectedDateData ? selectedDateData.slots.filter(t => !selectedDateData.booked.includes(t)) : [];

    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-3xl p-8 overflow-auto">
        {toast && <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{toast.message}</div>}
        <div className="max-w-7xl mx-auto">
          <ProgressSteps />
          <button onClick={() => setStep(2)} className="flex items-center gap-2 mb-6 text-emerald-600 font-medium hover:gap-3 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back to doctors
          </button>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl p-6 shadow-xl sticky top-8">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center text-5xl shadow-xl">👨‍⚕️</div>
                </div>
                <h2 className="text-xl font-bold text-center text-gray-800 mb-1">{selectedDoctor.name}</h2>
                <p className="text-emerald-600 text-center font-medium text-sm">{selectedDoctor.specialization}</p>
                <div className="mt-4 p-4 bg-white rounded-2xl space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Fee</span><span className="font-bold text-emerald-600">LKR {selectedDoctor.consultationFee || 2500}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Hospital</span><span className="text-gray-700">{selectedDoctor.hospital}</span></div>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('appointments.selectSchedule')}</h3>
                {loadingSlots ? (
                  <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/></div>
                ) : dates.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-xl font-medium mb-2">No available dates</p>
                    <p className="text-sm">This doctor has not set availability for this month yet.</p>
                  </div>
                ) : (
                  <>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Choose a Date</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-8">
                      {dates.map((date) => (
                        <button key={date} onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                          className={`text-center py-4 rounded-2xl transition-all duration-300 ${selectedDate === date
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105'
                            : 'bg-gray-50 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200 text-gray-700'}`}>
                          <div className="text-xs opacity-80">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-2xl font-bold mt-1">{new Date(date + 'T00:00:00').getDate()}</div>
                        </button>
                      ))}
                    </div>
                    {selectedDate && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Available Time Slots</label>
                        {freeSlots.length === 0 ? (
                          <p className="text-gray-400 text-sm py-4">No free slots on this date. Please pick another date.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {freeSlots.map((time) => (
                              <button key={time} onClick={() => setSelectedTime(time)}
                                className={`py-4 text-center rounded-2xl font-semibold transition-all duration-300 ${selectedTime === time
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105'}`}>
                                {time}
                                <span className="block text-xs mt-1">Available</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <button disabled={!selectedTime} onClick={() => setStep(4)}
                      className="mt-10 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg">
                     {t('appointments.continueToPayment')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 4: Payment ────────────────────────────────────────────
  if (step === 4) return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-3xl p-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <ProgressSteps />
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mt-8">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white text-center">
            <div className="text-5xl mb-3">💳</div>
            <h2 className="text-2xl font-bold">{t('appointments.securePayment')}</h2>
            <p className="text-emerald-100 text-sm mt-1">{t('appointments.poweredByStripe')}</p>
          </div>
          <div className="p-8">
            <div className="bg-emerald-50 rounded-2xl p-5 mb-6 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Doctor</span><span className="font-semibold">{selectedDoctor?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Date & Time</span><span className="font-semibold">{selectedDate} at {selectedTime}</span></div>
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-emerald-600">LKR {selectedDoctor?.consultationFee || 2500}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="flex gap-2">
                <div className="w-10 h-6 bg-blue-600 rounded" />
                <div className="w-10 h-6 bg-red-500 rounded" />
                <div className="w-10 h-6 bg-orange-500 rounded" />
              </div>
              <span className="text-xs text-gray-400">We accept all major cards via Stripe</span>
            </div>
            <button onClick={handlePayment} disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:transform-none flex items-center justify-center gap-3">
              {loading ? <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />Processing...</> : `Pay LKR ${selectedDoctor?.consultationFee || 2500} →`}
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              <span>256-bit SSL Secure by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
};

export default BookAppointment;