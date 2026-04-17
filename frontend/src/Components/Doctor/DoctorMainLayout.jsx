import { useState, useEffect } from 'react';
import DoctorSidebar from './DoctorSidebar';
import AppointmentRequests from '../../Pages/Doctors/AppointmentRequests';
import DoctorProfile from '../../Pages/Doctors/DoctorProfile';
import IssuePrescriptions from '../../Pages/Doctors/IssuePrescriptions';
import SetAvailability from '../../Pages/Doctors/SetAvailability';
import ViewFullSchedule from '../../Pages/Doctors/ViewFullSchedule';
import VideoConsultations from '../../Pages/Doctors/VideoConsultations';
import MyPatients from '../../Pages/Doctors/MyPatients';
import PatientReports from '../../Pages/Doctors/PatientReports';

const DoctorMainLayout = ({ children, onLogout }) => {
  const [activePage, setActivePage] = useState('doctor-dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-40 bg-teal-600 text-white px-3 py-2 rounded-xl shadow-lg"
        onClick={() => setIsSidebarOpen(true)}
      >
        Menu
      </button>
      <DoctorSidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col">    
        <div className="flex-1 overflow-auto p-4 sm:p-5 pt-16 md:pt-2">
          {activePage === 'doctor-dashboard' && children} 
          {activePage === 'appointment-requests' && <AppointmentRequests />}  
          {activePage === 'profile' && <DoctorProfile />}
          {activePage === 'issue-prescriptions' && <IssuePrescriptions />}
          {activePage === 'set-availability' && <SetAvailability />}
          {activePage === 'view-full-schedule' && <ViewFullSchedule />}
          {activePage === 'video-consultations' && <VideoConsultations />}
          {activePage === 'my-patients' && <MyPatients />}
          {activePage === 'patient-reports' && <PatientReports />}
        </div>
      </div>
    </div>
  );
};

export default DoctorMainLayout;