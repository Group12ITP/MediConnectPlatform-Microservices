import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

// Patient Pages
import BookAppointment from '../../Pages/Appointments/BookAppointment';
import MyAppointments from '../../Pages/Appointments/MyAppointments';
import VideoConsultations from '../../Pages/Appointments/VideoConsultations';
import UploadReports from '../../Pages/MedicalRecords/UploadReports';
import MedicalHistory from '../../Pages/MedicalRecords/MedicalHistory';
import ViewPrescriptions from '../../Pages/MedicalRecords/ViewPrescriptions';
import PharmacyFinder from '../../Pages/MedicalRecords/PharmacyFinder';
import ChatbotInterface from '../../Pages/Chatbot';
import PatientDashboard from '../../Pages/Dashboard/PatientDashboard'; 
import BrowseDoctors from '../../Pages/Doctors/BrowseDoctors';
import HealthReports from '../../Pages/HealthReports/HealthReports';
import PatientProfile from '../..//Pages/Patients/PatientProfile';

const PatientMainLayout = ({ onLogout }) => {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [preSelectedDoctor, setPreSelectedDoctor] = useState(null);
  const location = useLocation();

  // Check for pre-selected doctor from navigation state
  useEffect(() => {
    if (location.state?.preSelectedDoctor) {
      setPreSelectedDoctor(location.state.preSelectedDoctor);
      // If the flag is set to open book appointment, switch to booking page
      if (location.state.openBookAppointment) {
        setActivePage('book');
      }
      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Pass preSelectedDoctor to BookAppointment component
  const renderBookAppointment = () => {
    return <BookAppointment preSelectedDoctor={preSelectedDoctor} />;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-40 bg-emerald-600 text-white px-3 py-2 rounded-xl shadow-lg"
        onClick={() => setIsSidebarOpen(true)}
      >
        Menu
      </button>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col">    
        <div className="flex-1 overflow-auto p-4 sm:p-6 pt-16 md:pt-6">
          {activePage === 'dashboard' && (
            <PatientDashboard setActivePage={setActivePage} />
          )} 
          
          {activePage === 'browse-doctors' && <BrowseDoctors />}
          {activePage === 'book' && renderBookAppointment()}
          {activePage === 'my-appointments' && <MyAppointments />}
          {activePage === 'video-consultations' && <VideoConsultations />}
          {activePage === 'upload-reports' && <UploadReports />}
          {activePage === 'medical-history' && <MedicalHistory />}
          {activePage === 'prescriptions' && <ViewPrescriptions />}
          {activePage === 'pharmacy-finder' && <PharmacyFinder />}
          {activePage === 'health-reports' && <HealthReports />}
          {activePage === 'chatbot' && <ChatbotInterface />}
          {activePage === 'profile' && <PatientProfile />}
        </div>
      </div>
    </div>
  );
};

export default PatientMainLayout;