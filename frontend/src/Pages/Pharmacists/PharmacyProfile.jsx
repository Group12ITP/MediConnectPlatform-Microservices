import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("pharmacistToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const emptyForm = {
  name: "",
  registrationNumber: "",
  email: "",
  phone: "",
  alternatePhone: "",
  description: "",
  is24Hours: false,
  address: {
    street: "",
    city: "",
    district: "",
    province: "",
    country: "Sri Lanka",
    postalCode: "",
  },
};

const PharmacyProfile = () => {
  const [form, setForm] = useState(emptyForm);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/pharmacy/profile/me`, { headers: authHeaders() });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setHasProfile(true);
          setForm({
            ...emptyForm,
            ...json.data,
            address: { ...emptyForm.address, ...(json.data.address || {}) },
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setAddressField = (field, value) =>
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const url = hasProfile ? `${API}/pharmacy/profile/me` : `${API}/pharmacy/profile`;
      const method = hasProfile ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Unable to save pharmacy profile");
      setHasProfile(true);
      setMessage("Pharmacy profile saved successfully.");
    } catch (err) {
      setMessage(err.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pharmacy profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm">
                🏥
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Pharmacy Profile</h1>
                <p className="text-teal-100 text-sm mt-1">
                  {hasProfile 
                    ? "Update your pharmacy information that patients will see" 
                    : "Create your pharmacy profile to get started"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="p-8">
            {/* Basic Information Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                <span className="text-xs text-gray-400 ml-2">Required fields are marked with *</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pharmacy Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="e.g., City Pharmacy" 
                    value={form.name} 
                    onChange={(e) => setField("name", e.target.value)} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number {!hasProfile && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="Pharmacy registration number" 
                    value={form.registrationNumber} 
                    onChange={(e) => setField("registrationNumber", e.target.value)} 
                    required={!hasProfile} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="pharmacy@example.com" 
                    type="email"
                    value={form.email} 
                    onChange={(e) => setField("email", e.target.value)} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="+94 77 123 4567" 
                    value={form.phone} 
                    onChange={(e) => setField("phone", e.target.value)} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone Number</label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="+94 77 765 4321" 
                    value={form.alternatePhone} 
                    onChange={(e) => setField("alternatePhone", e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Address Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="Street name and number" 
                    value={form.address.street} 
                    onChange={(e) => setAddressField("street", e.target.value)} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="e.g., Colombo" 
                    value={form.address.city} 
                    onChange={(e) => setAddressField("city", e.target.value)} 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="e.g., Colombo District" 
                    value={form.address.district} 
                    onChange={(e) => setAddressField("district", e.target.value)} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                    value={form.address.province}
                    onChange={(e) => setAddressField("province", e.target.value)}
                  >
                    <option value="">Select Province</option>
                    <option value="Western">Western Province</option>
                    <option value="Central">Central Province</option>
                    <option value="Southern">Southern Province</option>
                    <option value="Northern">Northern Province</option>
                    <option value="Eastern">Eastern Province</option>
                    <option value="North Western">North Western Province</option>
                    <option value="North Central">North Central Province</option>
                    <option value="Uva">Uva Province</option>
                    <option value="Sabaragamuwa">Sabaragamuwa Province</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                    value={form.address.country}
                    onChange={(e) => setAddressField("country", e.target.value)}
                  >
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                  <input 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all" 
                    placeholder="e.g., 12345" 
                    value={form.address.postalCode} 
                    onChange={(e) => setAddressField("postalCode", e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pharmacy Description</label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 min-h-28 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none"
                    placeholder="Describe your pharmacy, services offered, specialties, etc..."
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Maximum 500 characters</p>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.is24Hours} 
                      onChange={(e) => setField("is24Hours", e.target.checked)} 
                      className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Open 24 Hours</span>
                      <p className="text-xs text-gray-500 mt-0.5">Check if your pharmacy operates 24/7</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={saving}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  hasProfile
                    ? "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                } text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : hasProfile ? "Update Profile" : "Create Profile"}
              </button>
              
              {hasProfile && (
                <button 
                  type="button"
                  onClick={() => {
                    if (window.confirm("Reset all changes? Unsaved data will be lost.")) {
                      window.location.reload();
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Message Alert */}
            {message && (
              <div className={`mt-4 rounded-xl p-4 ${
                message.includes("successfully") 
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                <div className="flex items-center gap-2">
                  {message.includes("successfully") ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900">About Pharmacy Profile</h3>
              <p className="text-xs text-blue-700 mt-1">
                Your pharmacy profile helps patients find you. Complete all required fields to ensure 
                your pharmacy appears in search results. You can update this information anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyProfile;