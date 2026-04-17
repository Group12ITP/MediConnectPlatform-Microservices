import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const roles = ["doctor", "patient", "pharmacist", "admin"];

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = localStorage.getItem("adminToken");

  const [overview, setOverview] = useState(null);
  const [usersByRole, setUsersByRole] = useState({});
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedRoles, setExpandedRoles] = useState({ doctor: true, patient: true, pharmacist: true, admin: true });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchAll = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [overviewRes, pendingDocRes, financeRes, ...roleResponses] = await Promise.all([
        fetch(`${API_URL}/admin/overview`, { headers: authHeaders }),
        fetch(`${API_URL}/admin/doctors/pending`, { headers: authHeaders }),
        fetch(`${API_URL}/admin/financial-transactions`, { headers: authHeaders }),
        ...roles.map((role) => fetch(`${API_URL}/admin/users/${role}?limit=100`, { headers: authHeaders })),
      ]);

      const overviewJson = await overviewRes.json();
      if (!overviewRes.ok) throw new Error(overviewJson.message || "Failed to load overview.");

      const pendingJson = await pendingDocRes.json();
      const financeJson = await financeRes.json();
      const roleJsons = await Promise.all(roleResponses.map((r) => r.json()));

      setOverview(overviewJson.data || null);
      setPendingDoctors(pendingJson.data || []);
      setTransactions(financeJson.data || []);
      setUsersByRole(
        roleJsons.reduce((acc, payload, idx) => {
          acc[roles[idx]] = payload.data || [];
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err.message || "Failed to load admin data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchAll();
  }, [token]);

  const updateStatus = async (role, id, isActive) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${role}/${id}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status.");
      await fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyDoctor = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/doctors/${id}/verify`, { method: "PATCH", headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify doctor.");
      await fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const approvePharmacist = async (id) => {
    try {
      const res = await fetch(`${API_URL}/admin/pharmacists/${id}/approve`, { method: "PATCH", headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve pharmacist.");
      await fetchAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    if (localStorage.getItem("lastRole") === "admin") localStorage.removeItem("lastRole");
    if (onLogout) onLogout();
    navigate("/admin/login");
  };

  const toggleRoleExpand = (role) => {
    setExpandedRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = (role) => {
    const users = usersByRole[role] || [];
    if (!searchTerm) return users;
    return users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredTransactions = transactions.filter(tx => {
    if (selectedRole === "all") return true;
    if (selectedRole === "doctor") return tx.doctor?.name;
    if (selectedRole === "patient") return tx.patient?.name;
    return true;
  });

  const navItems = [
    { id: "overview", label: "Dashboard Overview", icon: ChartBarIcon, color: "from-blue-500 to-blue-600" },
    { id: "doctors", label: "Doctors Management", icon: UserGroupIcon, color: "from-purple-500 to-purple-600" },
    { id: "patients", label: "Patients Management", icon: UsersIcon, color: "from-green-500 to-green-600" },
    { id: "pharmacists", label: "Pharmacists Management", icon: BuildingStorefrontIcon, color: "from-orange-500 to-orange-600" },
    { id: "admins", label: "Admins Management", icon: ShieldCheckIcon, color: "from-red-500 to-red-600" },
    { id: "verifications", label: "Pending Verifications", icon: CheckCircleIcon, color: "from-yellow-500 to-yellow-600" },
    { id: "transactions", label: "Financial Transactions", icon: CreditCardIcon, color: "from-indigo-500 to-indigo-600" },
  ];

  const renderOverview = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <UsersIcon className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{overview?.users?.doctors + overview?.users?.patients + overview?.users?.pharmacists + overview?.users?.admins || 0}</span>
          </div>
          <p className="text-sm opacity-90">Total Users</p>
          <p className="text-xs mt-2 opacity-75">Active accounts in system</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <UserGroupIcon className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{overview?.users?.doctors || 0}</span>
          </div>
          <p className="text-sm opacity-90">Total Doctors</p>
          <p className="text-xs mt-2 opacity-75">Medical professionals</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <CheckCircleIcon className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">{overview?.verifications?.pendingDoctors + overview?.verifications?.pendingPharmacists || 0}</span>
          </div>
          <p className="text-sm opacity-90">Pending Verifications</p>
          <p className="text-xs mt-2 opacity-75">Awaiting approval</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between mb-4">
            <CreditCardIcon className="h-8 w-8 opacity-80" />
            <span className="text-3xl font-bold">LKR {overview?.finance?.totalRevenue?.toLocaleString() || 0}</span>
          </div>
          <p className="text-sm opacity-90">Total Revenue</p>
          <p className="text-xs mt-2 opacity-75">{overview?.finance?.paidTransactions || 0} paid transactions</p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">User Distribution</h3>
          <div className="space-y-3">
            {[
              { label: "Doctors", count: overview?.users?.doctors || 0, color: "bg-purple-500" },
              { label: "Patients", count: overview?.users?.patients || 0, color: "bg-green-500" },
              { label: "Pharmacists", count: overview?.users?.pharmacists || 0, color: "bg-orange-500" },
              { label: "Admins", count: overview?.users?.admins || 0, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-semibold text-gray-800">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${(item.count / (overview?.users?.doctors + overview?.users?.patients + overview?.users?.pharmacists + overview?.users?.admins || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Verification Queue</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-semibold text-gray-800">Pending Doctors</p>
                  <p className="text-sm text-gray-600">Awaiting verification</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{overview?.verifications?.pendingDoctors || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <BuildingStorefrontIcon className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-semibold text-gray-800">Pending Pharmacists</p>
                  <p className="text-sm text-gray-600">Awaiting approval</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-600">{overview?.verifications?.pendingPharmacists || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderUserTable = (role, title, IconComponent) => {
    const users = filteredUsers(role);
    const isExpanded = expandedRoles[role];

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <button
          onClick={() => toggleRoleExpand(role)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <IconComponent className="h-5 w-5 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 capitalize">{title}</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{users.length}</span>
          </div>
          {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
        </button>

        {isExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-t border-gray-100">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No {role}s found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{user.name || user.email.split('@')[0]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {role === "pharmacist" && user.isApproved === false && (
                            <button
                              onClick={() => approvePharmacist(user.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => updateStatus(role, user.id, !user.isActive)}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderVerifications = () => (
    <div className="space-y-6">
      {/* Pending Doctors */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-yellow-600" />
            Pending Doctor Verifications
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingDoctors.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">No pending doctor verifications</div>
          ) : (
            pendingDoctors.map((doctor) => (
              <div key={doctor.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {doctor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{doctor.name}</p>
                      <p className="text-sm text-gray-500">{doctor.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm ml-13">
                    <p className="text-gray-600"><span className="font-medium">Specialization:</span> {doctor.specialization}</p>
                    <p className="text-gray-600"><span className="font-medium">License:</span> {doctor.licenseNumber}</p>
                    {doctor.experience && <p className="text-gray-600"><span className="font-medium">Experience:</span> {doctor.experience} years</p>}
                    {doctor.qualification && <p className="text-gray-600"><span className="font-medium">Qualification:</span> {doctor.qualification}</p>}
                  </div>
                </div>
                <button
                  onClick={() => verifyDoctor(doctor.id)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Verify Doctor
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5 text-indigo-600" />
          Financial Transactions
        </h3>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Transactions</option>
          <option value="doctor">By Doctor</option>
          <option value="patient">By Patient</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment ID</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No transactions found</td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">#{tx.appointmentId}</td>
                  <td className="px-6 py-4 text-gray-800">{tx.patient?.name || '-'}</td>
                  <td className="px-6 py-4 text-gray-800">{tx.doctor?.name || '-'}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">LKR {tx.consultationFee?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tx.paymentStatus)}`}>
                      {tx.paymentStatus || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const getSectionContent = () => {
    switch (activeSection) {
      case "overview": return renderOverview();
      case "doctors": return renderUserTable("doctor", "Doctors", UserGroupIcon);
      case "patients": return renderUserTable("patient", "Patients", UsersIcon);
      case "pharmacists": return renderUserTable("pharmacist", "Pharmacists", BuildingStorefrontIcon);
      case "admins": return renderUserTable("admin", "Admins", ShieldCheckIcon);
      case "verifications": return renderVerifications();
      case "transactions": return renderTransactions();
      default: return renderOverview();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Portal</h1>
              <p className="text-xs text-gray-500">System Management</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 group ${
                activeSection === item.id
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-102`
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              {activeSection === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-75"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                </h2>
                <p className="text-gray-500 mt-1">Welcome back, Administrator</p>
              </div>
              <button
                onClick={fetchAll}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Refresh Data
              </button>
            </div>

            {/* Search Bar */}
            {(activeSection !== "overview" && activeSection !== "verifications" && activeSection !== "transactions") && (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-96 pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <XCircleIcon className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {/* Dynamic Content */}
          {getSectionContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;