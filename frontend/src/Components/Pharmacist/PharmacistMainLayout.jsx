import { useState } from "react";
import PharmacistSidebar from "./PharmacistSidebar";
import PharmacistDashboard from "../../Pages/Pharmacists/PharmacistDashboard";
import PharmacyProfile from "../../Pages/Pharmacists/PharmacyProfile";
import InventoryManagement from "../../Pages/Pharmacists/InventoryManagement";

const PharmacistMainLayout = ({ onLogout }) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-40 bg-cyan-600 text-white px-3 py-2 rounded-xl shadow-lg"
        onClick={() => setIsSidebarOpen(true)}
      >
        Menu
      </button>
      <PharmacistSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-4 sm:p-5 pt-16 md:pt-4">
          {activePage === "dashboard" && <PharmacistDashboard />}
          {activePage === "pharmacy-profile" && <PharmacyProfile />}
          {activePage === "inventory" && <InventoryManagement />}
        </div>
      </div>
    </div>
  );
};

export default PharmacistMainLayout;
