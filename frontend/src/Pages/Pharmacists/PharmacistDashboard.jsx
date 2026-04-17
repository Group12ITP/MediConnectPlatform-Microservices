import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from '../../i18n/LanguageContext';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => {
  const token = localStorage.getItem("pharmacistToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const PharmacistDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [summary, setSummary] = useState({
    pharmacyName: "Your Pharmacy",
    totalInventory: 0,
    availableItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pharmacistName, setPharmacistName] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, inventoryRes, alertsRes] = await Promise.all([
          fetch(`${API}/pharmacy/profile/me`, { headers: authHeaders() }),
          fetch(`${API}/pharmacy/inventory`, { headers: authHeaders() }),
          fetch(`${API}/pharmacy/inventory/alerts/low-stock`, { headers: authHeaders() }),
        ]);

        const [profile, inventory, alerts] = await Promise.all([
          profileRes.json(),
          inventoryRes.json(),
          alertsRes.json(),
        ]);

        const inventoryData = inventory?.data || [];
        const outOfStock = inventoryData.filter((item) => item.quantityInStock === 0).length;
        
        // Get pharmacist name from profile
        const pharmacistInfo = JSON.parse(localStorage.getItem("pharmacistInfo") || "{}");
        const name = pharmacistInfo?.firstName && pharmacistInfo?.lastName 
          ? `${pharmacistInfo.firstName} ${pharmacistInfo.lastName}`
          : "Pharmacist";
        setPharmacistName(name);

        setSummary({
          pharmacyName: profile?.data?.pharmacyName || profile?.data?.name || "Your Pharmacy",
          totalInventory: inventoryData.length,
          availableItems: inventoryData.filter((item) => item.quantityInStock > 0).length,
          lowStockItems: alerts?.data?.length || 0,
          outOfStockItems: outOfStock,
        });

        // Mock recent orders - replace with actual API call when available
        setRecentOrders([
          { id: "ORD001", customer: "John Doe", amount: "LKR 2,500", status: "pending", time: "2 hours ago" },
          { id: "ORD002", customer: "Sarah Smith", amount: "LKR 1,200", status: "completed", time: "5 hours ago" },
          { id: "ORD003", customer: "Mike Johnson", amount: "LKR 3,800", status: "processing", time: "1 day ago" },
        ]);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: t('pharmacist.totalInventory'), value: summary.totalInventory, color: 'teal', icon: '📦', bgColor: 'bg-gradient-to-br from-teal-50 to-teal-100', iconBg: 'bg-teal-500' },
    { label: t('pharmacist.availableItems'), value: summary.availableItems, color: 'emerald', icon: '✅', bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100', iconBg: 'bg-emerald-500' },
    { label: t('pharmacist.lowStockAlerts'), value: summary.lowStockItems, color: 'amber', icon: '⚠️', bgColor: 'bg-gradient-to-br from-amber-50 to-amber-100', iconBg: 'bg-amber-500' },
    { label: t('pharmacist.outOfStock'), value: summary.outOfStockItems, color: 'rose', icon: '❌', bgColor: 'bg-gradient-to-br from-rose-50 to-rose-100', iconBg: 'bg-rose-500' },
  ];

  const quickActions = [
    { name: "Add Medicine", icon: "💊", path: "/pharmacist/inventory", color: "teal", description: "Add new medicines to inventory" },
    { name: "Manage Stock", icon: "📊", path: "/pharmacist/inventory", color: "blue", description: "Update stock quantities" },
    { name: "Update Profile", icon: "🏥", path: "/pharmacist/profile", color: "purple", description: "Edit pharmacy details" },
    { name: "View Orders", icon: "🛒", path: "/pharmacist/orders", color: "orange", description: "Check pending orders" },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Pending</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Processing</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-1">Fetching your pharmacy data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-teal-50/30">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {t('nav.dashboard')}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {t('dashboard.welcomeBack')}, <span className="font-semibold text-gray-700">{pharmacistName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/pharmacist/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors text-sm font-medium"
              >
                <span>🏥</span>
                <span>Pharmacy Profile</span>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                {pharmacistName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pharmacy Info Banner */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-1">Your Pharmacy</p>
                <h2 className="text-2xl font-bold">{summary.pharmacyName}</h2>
                <p className="text-teal-100 text-sm mt-2">Manage your inventory and serve patients better</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/pharmacist/inventory/add')}
                  className="bg-white text-teal-600 hover:bg-gray-50 px-5 py-2.5 rounded-xl transition-all text-sm font-medium shadow-lg flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Add Medicine</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card) => (
            <div key={card.label} className={`${card.bgColor} rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group`}>
              <div className="flex justify-between items-start mb-3">
                <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center text-2xl shadow-md`}>
                  {card.icon}
                </div>
                <span className="text-xs font-medium text-gray-500">Last 30 days</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-600 mt-1">{card.label}</p>
              <div className="mt-3">
                <div className={`h-1.5 bg-${card.color}-200 rounded-full overflow-hidden`}>
                  <div className={`h-full bg-${card.color}-500 rounded-full w-full`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
                Quick Actions
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all group text-left"
                  >
                    <div className="text-2xl">{action.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 group-hover:text-teal-600 transition-colors">
                        {action.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{action.description}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-teal-500 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mt-6 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Pro Tips</h3>
                  <p className="text-sm text-gray-600">
                    Keep your inventory updated daily to ensure patients can find accurate stock information. Update prices regularly to stay competitive.
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Health */}
            <div className="bg-white rounded-2xl p-5 mt-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>📈</span>
                Inventory Health
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Stock Coverage</span>
                    <span className="font-medium text-gray-900">
                      {summary.totalInventory === 0 ? 0 : Math.round((summary.availableItems / summary.totalInventory) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${summary.totalInventory === 0 ? 0 : (summary.availableItems / summary.totalInventory) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <div>
                    <p className="text-gray-500">Healthy Stock</p>
                    <p className="font-semibold text-gray-900">{summary.availableItems}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Need Attention</p>
                    <p className="font-semibold text-amber-600">{summary.lowStockItems + summary.outOfStockItems}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders & Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
                    {t('pharmacist.recentOrders')}
                  </h2>
                  <button 
                    onClick={() => navigate('/pharmacist/orders')}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                  >
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {recentOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-500">No orders yet</p>
                  <p className="text-gray-400 text-sm mt-1">Orders will appear here once received</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">{order.id}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-600">{order.customer}</p>
                          <p className="text-xs text-gray-400 mt-1">{order.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{order.amount}</p>
                          <button className="text-xs text-teal-600 hover:text-teal-700 mt-1 font-medium">
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">📊</span>
                  <span className="text-xs text-gray-400">This month</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500 mt-1">Orders Completed</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">+0% from last month</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xs text-gray-400">Average</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">0.0</p>
                <p className="text-sm text-gray-500 mt-1">Customer Rating</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-xl">ℹ️</div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Need Help?</h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Check your inventory regularly to avoid stockouts. Update medicine prices to stay competitive. 
                    Complete your pharmacy profile to help patients find you easily.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;