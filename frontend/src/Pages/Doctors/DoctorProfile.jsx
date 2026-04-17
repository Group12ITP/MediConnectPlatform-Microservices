import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Hospital, Briefcase, Award,
  Stethoscope, Edit2, Save, X, CheckCircle, Star,
  TrendingUp, Users, FileText, Shield,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authHeaders = () => {
  const token = localStorage.getItem('doctorToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const DoctorProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    specialization: '',
    email: '',
    phone: '',          // maps to `phoneNumber` in DB
    experience: 0,
    hospital: '',
    location: '',
    bio: '',
    qualification: '',
    education: [],
    certifications: [],
    languages: [],
    consultationFee: 0,
    rating: 5.0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch profile from backend ──────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/doctors/me/profile`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setProfile(prev => ({
            ...prev,
            name: d.name || '',
            specialization: d.specialization || '',
            email: d.email || '',
            phone: d.phoneNumber || '',   // map DB field → local field
            experience: d.experience ?? 0,
            hospital: d.hospital || '',
            location: d.location || '',
            bio: d.bio || '',
            qualification: d.qualification || '',
            education: d.education || [],
            certifications: d.certifications || [],
            languages: d.languages || [],
            consultationFee: d.consultationFee ?? 0,
            rating: d.rating ?? 5.0,
          }));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Field change helpers ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setProfile(prev => {
      const arr = [...(prev[field] || [])];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field) => {
    setProfile(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  };

  const removeArrayItem = (field, index) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Map frontend `phone` → backend `phoneNumber`
      const payload = {
        name: profile.name,
        specialization: profile.specialization,
        qualification: profile.qualification,
        experience: Number(profile.experience),
        hospital: profile.hospital,
        phoneNumber: profile.phone,
        bio: profile.bio,
        location: profile.location,
        consultationFee: Number(profile.consultationFee),
        education: profile.education.filter(Boolean),
        certifications: profile.certifications.filter(Boolean),
        languages: profile.languages.filter(Boolean),
      };

      const res = await fetch(`${API}/doctors/me/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setIsEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'credentials', label: 'Credentials', icon: Award },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-6 lg:p-10">

        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-6 right-6 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 p-4 flex items-center gap-3 animate-slide-in">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-gray-800">Profile updated successfully!</p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full shadow-sm border border-slate-200 mb-3">
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-slate-600">Doctor Profile</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">My Professional Profile</h1>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 rounded-2xl font-semibold bg-white border-2 border-slate-200 text-slate-700 hover:border-teal-500 transition-all duration-300 flex items-center gap-2"
              >
                <Edit2 className="w-5 h-5" /> Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg transition-all duration-300 flex items-center gap-2 hover:shadow-xl disabled:opacity-60"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Save Changes</>
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 rounded-2xl font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center gap-2"
                >
                  <X className="w-5 h-5" /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-t-2xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-teal-600 border-b-2 border-teal-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden sticky top-6">
              <div className="h-32 bg-gradient-to-r from-teal-500 to-cyan-600 relative" />
              <div className="relative px-6 pb-6">
                <div className="relative -mt-16 mb-4">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-teal-100 to-cyan-100 rounded-3xl flex items-center justify-center text-7xl shadow-xl border-4 border-white">
                    👨‍⚕️
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800">{profile.name || 'Your Name'}</h2>
                  <p className="text-teal-600 font-medium mt-1">{profile.specialization || 'Specialization'}</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">{profile.rating || '5.0'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">Verified</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 truncate">{profile.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">{profile.phone || 'No phone'}</span>
                  </div>
                  {profile.hospital && (
                    <div className="flex items-center gap-3 text-sm">
                      <Hospital className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">{profile.hospital}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">

            {/* ── Personal Info Tab ─────────────────────────── */}
            {activeTab === 'personal' && (
              <>
                {/* About / Bio */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-600" /> About Me
                  </h3>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Write something about your practice..."
                      className="w-full border border-slate-300 rounded-2xl px-5 py-4 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                    />
                  ) : (
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {profile.bio || 'No bio provided. Click Edit Profile to add one.'}
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Full Name" name="name" value={profile.name} onChange={handleChange} editing={isEditing} />
                    <Field label="Phone Number" name="phone" value={profile.phone} onChange={handleChange} editing={isEditing} type="tel" />
                    <Field label="Hospital / Clinic" name="hospital" value={profile.hospital} onChange={handleChange} editing={isEditing} />
                    <Field label="Location / City" name="location" value={profile.location} onChange={handleChange} editing={isEditing} />
                  </div>
                </div>
              </>
            )}

            {/* ── Professional Tab ──────────────────────────── */}
            {activeTab === 'professional' && (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-600" /> Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Specialization - read only since it's an enum in DB */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Specialization</label>
                    {isEditing ? (
                      <select
                        name="specialization"
                        value={profile.specialization}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-2xl px-5 py-3 focus:outline-none focus:border-teal-500 bg-white"
                      >
                        {[
                          'Cardiology','Neurology','Pediatrics','Orthopedics','Dermatology',
                          'Ophthalmology','Psychiatry','Radiology','Surgery','Internal Medicine',
                          'Emergency Medicine','Family Medicine','Other',
                        ].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <div className="w-full border border-slate-200 rounded-2xl px-5 py-3 bg-slate-50 text-slate-700">
                        {profile.specialization || '—'}
                      </div>
                    )}
                  </div>
                  <Field label="Qualification" name="qualification" value={profile.qualification} onChange={handleChange} editing={isEditing} />
                  <Field label="Experience (Years)" name="experience" value={profile.experience} onChange={handleChange} editing={isEditing} type="number" />
                  <Field label="Consultation Fee (LKR)" name="consultationFee" value={profile.consultationFee} onChange={handleChange} editing={isEditing} type="number" />
                </div>

                {/* Languages */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-600 mb-3">Languages Spoken</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {(profile.languages || []).map((lang, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            value={lang}
                            onChange={e => handleArrayChange('languages', idx, e.target.value)}
                            placeholder="e.g. English"
                            className="flex-1 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-teal-500"
                          />
                          <button
                            onClick={() => removeArrayItem('languages', idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addArrayItem('languages')}
                        className="mt-1 text-teal-600 text-sm font-medium hover:text-teal-700 flex items-center gap-1"
                      >
                        + Add Language
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(profile.languages || []).length > 0
                        ? profile.languages.map((l, i) => (
                            <span key={i} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">{l}</span>
                          ))
                        : <span className="text-slate-400 text-sm">No languages listed.</span>
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Credentials Tab ───────────────────────────── */}
            {activeTab === 'credentials' && (
              <>
                {/* Education */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-600" /> Education
                  </h3>
                  <div className="space-y-3">
                    {(profile.education || []).map((edu, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-3 flex-shrink-0" />
                        {isEditing ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              value={edu}
                              onChange={e => handleArrayChange('education', idx, e.target.value)}
                              placeholder="e.g. MBBS, University of Colombo"
                              className="flex-1 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-teal-500"
                            />
                            <button onClick={() => removeArrayItem('education', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-700 flex-1 py-1">{edu}</p>
                        )}
                      </div>
                    ))}
                    {(profile.education || []).length === 0 && !isEditing && (
                      <p className="text-slate-400 text-sm">No education listed.</p>
                    )}
                    {isEditing && (
                      <button onClick={() => addArrayItem('education')} className="mt-2 text-teal-600 text-sm font-medium hover:text-teal-700 flex items-center gap-1">
                        + Add Education
                      </button>
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-600" /> Certifications
                  </h3>
                  <div className="space-y-3">
                    {(profile.certifications || []).map((cert, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full mt-3 flex-shrink-0" />
                        {isEditing ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              value={cert}
                              onChange={e => handleArrayChange('certifications', idx, e.target.value)}
                              placeholder="e.g. Board Certified Cardiologist"
                              className="flex-1 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-teal-500"
                            />
                            <button onClick={() => removeArrayItem('certifications', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-700 flex-1 py-1">{cert}</p>
                        )}
                      </div>
                    ))}
                    {(profile.certifications || []).length === 0 && !isEditing && (
                      <p className="text-slate-400 text-sm">No certifications listed.</p>
                    )}
                    {isEditing && (
                      <button onClick={() => addArrayItem('certifications')} className="mt-2 text-teal-600 text-sm font-medium hover:text-teal-700 flex items-center gap-1">
                        + Add Certification
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Bottom Save Strip (while editing) */}
            {isEditing && (
              <div className="bg-white rounded-3xl shadow-xl border border-teal-100 p-5 flex justify-end gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 rounded-2xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Save All Changes</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable field component
const Field = ({ label, name, value, onChange, editing, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
    {editing ? (
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-2xl px-5 py-3 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      />
    ) : (
      <div className="w-full border border-slate-200 rounded-2xl px-5 py-3 bg-slate-50 text-slate-700 min-h-[48px]">
        {value || <span className="text-slate-400">—</span>}
      </div>
    )}
  </div>
);

export default DoctorProfile;