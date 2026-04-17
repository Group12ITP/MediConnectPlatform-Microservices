// PatientProfile.jsx
import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Droplet, Heart, AlertCircle,
  Edit2, Save, X, CheckCircle, Shield, Lock, Key, Trash2,
  Activity, ClipboardList, Clock, UserCheck, Camera
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authHeaders = () => {
  const token = localStorage.getItem('patientToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const PatientProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    medicalConditions: [],
    allergies: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Fetch profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/patient/profile`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setProfile({
            name: d.name || '',
            email: d.email || '',
            phoneNumber: d.phoneNumber || '',
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : '',
            gender: d.gender || '',
            bloodGroup: d.bloodGroup || '',
            address: d.address || '',
            medicalConditions: d.medicalConditions || [],
            allergies: d.allergies || [],
          });
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

  // Handle profile field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Handle array field changes (medical conditions, allergies)
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

  // Save profile changes
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
        address: profile.address,
        medicalConditions: profile.medicalConditions.filter(Boolean),
        allergies: profile.allergies.filter(Boolean),
      };

      const res = await fetch(`${API}/patient/profile`, {
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

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setChangingPassword(false);
      return;
    }

    try {
      const res = await fetch(`${API}/patient/change-password`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setPasswordSuccess(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Network error. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    if (!window.confirm('WARNING: All your medical records, appointments, and prescriptions will be permanently deleted. Type "DELETE" to confirm.')) {
      return;
    }

    try {
      const res = await fetch(`${API}/patient/account`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.removeItem('patientToken');
        localStorage.removeItem('patientInfo');
        window.location.href = '/patient/login';
      } else {
        setError(data.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'medical', label: 'Medical Info', icon: Heart },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-6 lg:p-10">

        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-6 right-6 z-50 animate-slide-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 p-4 flex items-center gap-3">
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
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-slate-600">Patient Profile</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">My Health Profile</h1>
            <p className="text-slate-500 mt-2">Manage your personal and medical information</p>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 rounded-2xl font-semibold bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-500 transition-all duration-300 flex items-center gap-2"
              >
                <Edit2 className="w-5 h-5" /> Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg transition-all duration-300 flex items-center gap-2 hover:shadow-xl disabled:opacity-60"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Save Changes</>
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
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
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                  ? 'bg-white text-emerald-600 border-b-2 border-emerald-600'
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
              <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative" />
              <div className="relative px-6 pb-6">
                <div className="relative -mt-16 mb-4">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center text-7xl shadow-xl border-4 border-white relative">
                    👤
                    <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-slate-200">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800">{profile.name || 'Your Name'}</h2>
                  <p className="text-emerald-600 font-medium mt-1">
                    {profile.bloodGroup ? `Blood Group: ${profile.bloodGroup}` : 'Blood Group not set'}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">
                        {profile.gender || 'Gender not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">Active Member</span>
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
                    <span className="text-slate-600">{profile.phoneNumber || 'No phone'}</span>
                  </div>
                  {profile.dateOfBirth && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">{new Date(profile.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600 line-clamp-2">{profile.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">

            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field 
                    label="Full Name" 
                    name="name" 
                    value={profile.name} 
                    onChange={handleChange} 
                    editing={isEditing} 
                  />
                  <Field 
                    label="Email" 
                    name="email" 
                    value={profile.email} 
                    editing={false}
                    disabled
                    note="Email cannot be changed"
                  />
                  <Field 
                    label="Phone Number" 
                    name="phoneNumber" 
                    value={profile.phoneNumber} 
                    onChange={handleChange} 
                    editing={isEditing} 
                    type="tel"
                  />
                  <Field 
                    label="Date of Birth" 
                    name="dateOfBirth" 
                    value={profile.dateOfBirth} 
                    onChange={handleChange} 
                    editing={isEditing} 
                    type="date"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Gender</label>
                    {isEditing ? (
                      <select
                        name="gender"
                        value={profile.gender}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-2xl px-5 py-3 focus:outline-none focus:border-emerald-500 bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className="w-full border border-slate-200 rounded-2xl px-5 py-3 bg-slate-50 text-slate-700">
                        {profile.gender || '—'}
                      </div>
                    )}
                  </div>
                  <Field 
                    label="Address" 
                    name="address" 
                    value={profile.address} 
                    onChange={handleChange} 
                    editing={isEditing} 
                  />
                </div>
              </div>
            )}

            {/* Medical Info Tab */}
            {activeTab === 'medical' && (
              <>
                {/* Blood Group */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-emerald-600" /> Medical Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Blood Group</label>
                      {isEditing ? (
                        <select
                          name="bloodGroup"
                          value={profile.bloodGroup}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-2xl px-5 py-3 focus:outline-none focus:border-emerald-500 bg-white"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      ) : (
                        <div className="w-full border border-slate-200 rounded-2xl px-5 py-3 bg-slate-50 text-slate-700">
                          {profile.bloodGroup || '—'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medical Conditions */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" /> Chronic Conditions
                  </h3>
                  <div className="space-y-3">
                    {(profile.medicalConditions || []).map((condition, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3 flex-shrink-0" />
                        {isEditing ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              value={condition}
                              onChange={e => handleArrayChange('medicalConditions', idx, e.target.value)}
                              placeholder="e.g. Diabetes, Hypertension"
                              className="flex-1 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500"
                            />
                            <button onClick={() => removeArrayItem('medicalConditions', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-700 flex-1 py-1">{condition}</p>
                        )}
                      </div>
                    ))}
                    {(profile.medicalConditions || []).length === 0 && !isEditing && (
                      <p className="text-slate-400 text-sm">No chronic conditions listed.</p>
                    )}
                    {isEditing && (
                      <button onClick={() => addArrayItem('medicalConditions')} className="mt-2 text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center gap-1">
                        + Add Condition
                      </button>
                    )}
                  </div>
                </div>

                {/* Allergies */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" /> Allergies
                  </h3>
                  <div className="space-y-3">
                    {(profile.allergies || []).map((allergy, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-3 flex-shrink-0" />
                        {isEditing ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              value={allergy}
                              onChange={e => handleArrayChange('allergies', idx, e.target.value)}
                              placeholder="e.g. Penicillin, Peanuts"
                              className="flex-1 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500"
                            />
                            <button onClick={() => removeArrayItem('allergies', idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-700 flex-1 py-1">{allergy}</p>
                        )}
                      </div>
                    ))}
                    {(profile.allergies || []).length === 0 && !isEditing && (
                      <p className="text-slate-400 text-sm">No allergies listed.</p>
                    )}
                    {isEditing && (
                      <button onClick={() => addArrayItem('allergies')} className="mt-2 text-emerald-600 text-sm font-medium hover:text-emerald-700 flex items-center gap-1">
                        + Add Allergy
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                {/* Change Password */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-600" /> Change Password
                  </h3>
                  
                  {passwordSuccess && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Password changed successfully!
                    </div>
                  )}
                  
                  {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {passwordError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Current Password</label>
                      <div className="relative">
                        <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                          className="w-full border border-slate-300 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-500"
                          placeholder="Enter current password"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">New Password</label>
                      <div className="relative">
                        <Key className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                          className="w-full border border-slate-300 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-500"
                          placeholder="Enter new password (min. 6 characters)"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Key className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                          className="w-full border border-slate-300 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                      {changingPassword ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                      ) : (
                        <><Lock className="w-5 h-5" /> Update Password</>
                      )}
                    </button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 rounded-3xl border border-red-200 p-6">
                  <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" /> Danger Zone
                  </h3>
                  <p className="text-red-600 text-sm mb-4">
                    Once you delete your account, all your data including medical records, appointments, and prescriptions will be permanently removed.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-6 py-3 rounded-2xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" /> Delete My Account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable field component
const Field = ({ label, name, value, onChange, editing, type = 'text', disabled = false, note = null }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
    {editing && !disabled ? (
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        className="w-full border border-slate-300 rounded-2xl px-5 py-3 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
    ) : (
      <div className="w-full border border-slate-200 rounded-2xl px-5 py-3 bg-slate-50 text-slate-700 min-h-[48px]">
        {value || <span className="text-slate-400">—</span>}
        {note && <span className="text-xs text-slate-400 ml-2">{note}</span>}
      </div>
    )}
  </div>
);

export default PatientProfile;