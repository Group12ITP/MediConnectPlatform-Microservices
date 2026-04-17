import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import DoctorMainLayout from "./Components/Doctor/DoctorMainLayout";
import DoctorDashboard from "./Pages/Doctors/DoctorDashboard";
import DoctorLogin from "./Pages/Doctors/DoctorLogin";
import DoctorRegister from "./Pages/Doctors/DoctorRegister";

// Patient Imports
import PatientMainLayout from "./Components/Layout/PatientMainLayout";
import VideoConsultationPage from "./Pages/Appointments/VideoConsultationPage";
import SelectRole from "./Pages/Auth/SelectRole";
import PatientLogin from "./Pages/Patients/PatientLogin";
import PatientRegister from "./Pages/Patients/PatientRegister";
import PaymentSuccess from "./Pages/Payment/PaymentSuccess";
import PharmacistLogin from "./Pages/Pharmacists/PharmacistLogin";
import PharmacistMainLayout from "./Components/Pharmacist/PharmacistMainLayout";
import PharmacistRegister from "./Pages/Pharmacists/PharmacistRegister";
import AdminLogin from "./Pages/Admin/AdminLogin";
import AdminDashboard from "./Pages/Admin/AdminDashboard";

// Doctor Views Imports
import BrowseDoctors from "./Pages/Doctors/BrowseDoctors";
import DoctorProfile from "./Pages/Doctors/ViewProfile";

import LandingPage from "./Pages/LandingPage";

const parseJwtPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

const isTokenValidForRole = (token, expectedRole) => {
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  if (payload.role !== expectedRole) return false;
  if (!payload.exp) return false;
  return payload.exp * 1000 > Date.now();
};

// Doctor Protected Route wrapper
const DoctorProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/doctor/login" replace />;
  return children;
};

// Patient Protected Route wrapper
const PatientProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/patient/login" replace />;
  return children;
};

const PharmacistProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/pharmacist/login" replace />;
  return children;
};

const AdminProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
};

const GuestOnlyRoute = ({ isAuthenticated, redirectTo, children }) => {
  if (isAuthenticated) return <Navigate to={redirectTo} replace />;
  return children;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDoctorAuth, setIsDoctorAuth] = useState(false);
  const [isPatientAuth, setIsPatientAuth] = useState(false);
  const [isPharmacistAuth, setIsPharmacistAuth] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  useEffect(() => {
    // Read auth state with token role + expiry validation
    const dToken = localStorage.getItem("doctorToken");
    setIsDoctorAuth(!!dToken && isTokenValidForRole(dToken, "doctor"));

    const pToken = localStorage.getItem("patientToken");
    setIsPatientAuth(!!pToken && isTokenValidForRole(pToken, "patient"));

    const phToken = localStorage.getItem("pharmacistToken");
    setIsPharmacistAuth(!!phToken && isTokenValidForRole(phToken, "pharmacist"));

    const aToken = localStorage.getItem("adminToken");
    setIsAdminAuth(!!aToken && isTokenValidForRole(aToken, "admin"));

    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleDoctorLogout = () => setIsDoctorAuth(false);
  const handleDoctorLogin = () => setIsDoctorAuth(true);

  const handlePatientLogout = () => setIsPatientAuth(false);
  const handlePatientLogin = () => setIsPatientAuth(true);
  const handlePharmacistLogout = () => setIsPharmacistAuth(false);
  const handlePharmacistLogin = () => setIsPharmacistAuth(true);
  const handleAdminLogout = () => setIsAdminAuth(false);
  const handleAdminLogin = () => setIsAdminAuth(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading MediConnect...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <Router>
      <Routes>
        {/* PAYMENT SUCCESS ROUTE */}
        <Route path="/payment/success" element={<PaymentSuccess />} />

        {/* PUBLIC DOCTOR ROUTES - No authentication required */}
        <Route path="/doctors" element={<BrowseDoctors />} />
        <Route path="/doctor-profile/:id" element={<DoctorProfile />} />

        {/* DOCTOR AUTH ROUTES */}
        <Route
          path="/doctor/login"
          element={
            <GuestOnlyRoute isAuthenticated={isDoctorAuth} redirectTo="/doctor/dashboard">
              <DoctorLogin onLoginSuccess={handleDoctorLogin} />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/doctor/register"
          element={
            <GuestOnlyRoute isAuthenticated={isDoctorAuth} redirectTo="/doctor/dashboard">
              <DoctorRegister onLoginSuccess={handleDoctorLogin} />
            </GuestOnlyRoute>
          }
        />
        
        {/* DOCTOR PROTECTED ROUTES */}
        <Route
          path="/doctor/dashboard"
          element={
            <DoctorProtectedRoute isAuthenticated={isDoctorAuth}>
              <DoctorMainLayout onLogout={handleDoctorLogout}>
                <DoctorDashboard />
              </DoctorMainLayout>
            </DoctorProtectedRoute>
          }
        />
        <Route
          path="/doctor/*"
          element={
            <DoctorProtectedRoute isAuthenticated={isDoctorAuth}>
              <DoctorMainLayout onLogout={handleDoctorLogout}>
                <DoctorDashboard />
              </DoctorMainLayout>
            </DoctorProtectedRoute>
          }
        />

        {/* PATIENT AUTH ROUTES */}
        <Route
          path="/patient/login"
          element={
            <GuestOnlyRoute isAuthenticated={isPatientAuth} redirectTo="/patient/dashboard">
              <PatientLogin onLoginSuccess={handlePatientLogin} />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/patient/register"
          element={
            <GuestOnlyRoute isAuthenticated={isPatientAuth} redirectTo="/patient/dashboard">
              <PatientRegister onLoginSuccess={handlePatientLogin} />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/pharmacist/login"
          element={
            <GuestOnlyRoute isAuthenticated={isPharmacistAuth} redirectTo="/pharmacist/dashboard">
              <PharmacistLogin onLoginSuccess={handlePharmacistLogin} />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/pharmacist/register"
          element={
            <GuestOnlyRoute isAuthenticated={isPharmacistAuth} redirectTo="/pharmacist/dashboard">
              <PharmacistRegister />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <GuestOnlyRoute isAuthenticated={isAdminAuth} redirectTo="/admin/dashboard">
              <AdminLogin onLoginSuccess={handleAdminLogin} />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/pharmacist/dashboard"
          element={
            <PharmacistProtectedRoute isAuthenticated={isPharmacistAuth}>
              <PharmacistMainLayout onLogout={handlePharmacistLogout} />
            </PharmacistProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute isAuthenticated={isAdminAuth}>
              <AdminDashboard onLogout={handleAdminLogout} />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/pharmacist/*"
          element={
            <PharmacistProtectedRoute isAuthenticated={isPharmacistAuth}>
              <PharmacistMainLayout onLogout={handlePharmacistLogout} />
            </PharmacistProtectedRoute>
          }
        />
        
        {/* PATIENT PROTECTED ROUTES */}
        <Route
          path="/patient/dashboard"
          element={
            <PatientProtectedRoute isAuthenticated={isPatientAuth}>
              <PatientMainLayout onLogout={handlePatientLogout} />
            </PatientProtectedRoute>
          }
        />
        <Route
          path="/patient/*"
          element={
            <PatientProtectedRoute isAuthenticated={isPatientAuth}>
              <PatientMainLayout onLogout={handlePatientLogout} />
            </PatientProtectedRoute>
          }
        />

        {/* Video Consultation Routes */}
        <Route
          path="/patient/video/:roomId"
          element={
            <PatientProtectedRoute isAuthenticated={isPatientAuth}>
              <VideoConsultationPage />
            </PatientProtectedRoute>
          }
        />
        <Route
          path="/doctor/video/:roomId"
          element={
            <DoctorProtectedRoute isAuthenticated={isDoctorAuth}>
              <VideoConsultationPage />
            </DoctorProtectedRoute>
          }
        />

        {/* Appointment Booking Route (Protected) */}
        <Route
          path="/patient/book-appointment/:doctorId"
          element={
            <PatientProtectedRoute isAuthenticated={isPatientAuth}>
              {/* You'll need to create this component */}
              <div>Appointment Booking Page (To be implemented)</div>
            </PatientProtectedRoute>
          }
        />

        {/* Role Selection Route */}
        <Route path="/select-role" element={<SelectRole />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Navigate to="/select-role" replace />} />
        <Route path="/register" element={<Navigate to="/select-role" replace />} />
        
        {/* Landing Page - Default Route */}
        <Route
          path="/"
          element={
            (() => {
              // If user is already authenticated, redirect to their dashboard
              if (isDoctorAuth) return <Navigate to="/doctor/dashboard" replace />;
              if (isPatientAuth) return <Navigate to="/patient/dashboard" replace />;
              if (isPharmacistAuth) return <Navigate to="/pharmacist/dashboard" replace />;
              if (isAdminAuth) return <Navigate to="/admin/dashboard" replace />;
              // Otherwise show landing page
              return <LandingPage />;
            })()
          }
        />
        
        {/* Catch all route - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;