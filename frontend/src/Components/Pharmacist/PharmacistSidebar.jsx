import { useNavigate } from "react-router-dom";

const PharmacistSidebar = ({ activePage, setActivePage, onLogout, isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const pharmacist = JSON.parse(localStorage.getItem("pharmacistInfo") || "{}");

  const handleLogout = async () => {
    const token = localStorage.getItem("pharmacistToken");
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    try {
      await fetch(`${API}/pharmacy/auth/logout-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Fall back to local logout.
    } finally {
      localStorage.removeItem("pharmacistToken");
      localStorage.removeItem("pharmacistInfo");
      if (onLogout) onLogout();
      navigate("/pharmacist/login");
    }
  };

  const items = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "pharmacy-profile", label: "Pharmacy Profile", icon: "🏥" },
    { id: "inventory", label: "Inventory", icon: "💊" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={`fixed md:static top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
      <div className="px-6 py-5 border-b flex items-center gap-x-3">
        <div className="w-9 h-9 bg-cyan-600 rounded-2xl flex items-center justify-center text-white text-2xl">💊</div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">MediConnect</span>
          <span className="block text-xs font-medium text-cyan-600 -mt-1">PHARMACIST PORTAL</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActivePage(item.id);
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-x-3 px-4 py-3 rounded-2xl text-left text-sm font-medium transition-all mb-1 ${
              activePage === item.id ? "bg-cyan-600 text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mx-4 mb-6 p-4 bg-cyan-50 border border-cyan-100 rounded-3xl">
        <p className="font-semibold text-gray-800">
          {pharmacist.firstName ? `${pharmacist.firstName} ${pharmacist.lastName}` : "Pharmacist"}
        </p>
        <p className="text-xs text-cyan-600 mt-1">{pharmacist.licenseNumber || "Inventory access"}</p>
        <button
          onClick={() => {
            handleLogout();
            if (onClose) onClose();
          }}
          className="w-full mt-3 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-sm font-medium transition-all"
        >
          Logout
        </button>
      </div>
      </div>
    </>
  );
};

export default PharmacistSidebar;
