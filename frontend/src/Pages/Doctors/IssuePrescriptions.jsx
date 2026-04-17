import { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('doctorToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper functions for medicine name parsing
const parseMedicineName = (medicineName) => {
  if (!medicineName) return '';
  
  // Pattern to match common dosage formats at the end of string
  const dosagePattern = /\s+\d+(\.\d+)?\s*(mg|mcg|μg|g|ml|IU|units?|%)\s*$/i;
  const match = medicineName.match(dosagePattern);
  
  if (match) {
    // Remove the dosage part
    return medicineName.substring(0, match.index).trim();
  }
  
  // Also handle patterns like "Sertraline 50"
  const numericPattern = /\s+\d+\s*$/;
  const numericMatch = medicineName.match(numericPattern);
  if (numericMatch) {
    return medicineName.substring(0, numericMatch.index).trim();
  }
  
  // Return original if no pattern matches
  return medicineName;
};

const extractDosage = (medicineName) => {
  if (!medicineName) return '';
  
  const dosagePattern = /(\d+(\.\d+)?\s*(mg|mcg|μg|g|ml|IU|units?|%))/i;
  const match = medicineName.match(dosagePattern);
  return match ? match[1] : '';
};

const cleanMedicineName = (fullName) => {
  if (!fullName) return '';
  
  const dosagePattern = /\s+\d+(\.\d+)?\s*(mg|mcg|μg|g|ml|IU|units?|%)\s*$/i;
  const match = fullName.match(dosagePattern);
  
  if (match) {
    return fullName.substring(0, match.index).trim();
  }
  
  const numericPattern = /\s+\d+\s*$/;
  const numericMatch = fullName.match(numericPattern);
  if (numericMatch) {
    return fullName.substring(0, numericMatch.index).trim();
  }
  
  return fullName;
};

const IssuePrescriptions = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', frequency: '', days: '' });
  const [notes, setNotes] = useState('');
  const [issued, setIssued] = useState(false);
  const [issuedPrescription, setIssuedPrescription] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const canvasRef = useRef(null);

  // API state
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const commonMedicines = [
    { name: 'Amlodipine', dosage: '5mg' },
    { name: 'Atorvastatin', dosage: '20mg' },
    { name: 'Metformin', dosage: '500mg' },
    { name: 'Pantoprazole', dosage: '40mg' },
    { name: 'Sertraline', dosage: '50mg' },
    { name: 'Ciprofloxacin', dosage: '500mg' },
    { name: 'Paracetamol', dosage: '500mg' },
    { name: 'Omeprazole', dosage: '20mg' },
    { name: 'Losartan', dosage: '50mg' },
    { name: 'Amoxicillin', dosage: '500mg' },
    { name: 'Ibuprofen', dosage: '400mg' },
    { name: 'Levothyroxine', dosage: '50mcg' },
  ];

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch doctor info and patient list on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorRes, patientsRes] = await Promise.all([
          fetch(`${API_BASE}/prescriptions/doctor-info`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/prescriptions/patients`, { headers: getAuthHeaders() }),
        ]);

        const doctorJson = await doctorRes.json();
        const patientsJson = await patientsRes.json();

        if (doctorJson.success) setDoctorInfo(doctorJson.data);
        if (patientsJson.success) setPatients(patientsJson.data);
      } catch (err) {
        showToast('error', 'Failed to load doctor info or patients');
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchData();
  }, []);

  // ── Signature Pad ──────────────────────────────────────────
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x, y;
    
    if (e.touches) {
      // Touch event
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
      e.preventDefault();
    } else {
      // Mouse event
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x, y;
    
    if (e.touches) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
      e.preventDefault();
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }
    
    ctx.lineTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0d9488';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    setSignatureData(canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // ── Medicine Management ────────────────────────────────────
  const addMedicine = () => {
    if (!newMedicine.name) return;
    
    // If dosage is provided separately, combine for display but store clean
    const displayName = newMedicine.dosage 
      ? `${newMedicine.name} ${newMedicine.dosage}`
      : newMedicine.name;
    
    setMedicines([...medicines, { 
      id: Date.now(),
      name: newMedicine.name, // Store clean name
      displayName: displayName,
      dosage: newMedicine.dosage,
      frequency: newMedicine.frequency,
      days: newMedicine.days
    }]);
    
    setNewMedicine({ name: '', dosage: '', frequency: '', days: '' });
  };

  const removeMedicine = (id) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  // ── Generate Prescription PDF (Client-side with html2pdf) ──
  const generatePrescriptionPDF = async (prescriptionData) => {
    setGeneratingPdf(true);
    try {
      showToast('info', 'Generating PDF...');
      
      // Create a temporary container
      const element = document.createElement('div');
      element.style.padding = '40px';
      element.style.backgroundColor = 'white';
      element.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
      element.style.maxWidth = '800px';
      element.style.margin = '0 auto';
      element.style.lineHeight = '1.6';
      
      // Format dates
      const currentDate = new Date().toLocaleString();
      
      // Generate HTML content
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0d9488;">
          <h1 style="color: #0d9488; margin-bottom: 10px; font-size: 28px; font-weight: bold;">Medical Prescription</h1>
          <p style="color: #6b7280; font-size: 12px;">Generated on ${currentDate}</p>
        </div>
        
        <!-- Header Info -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <p style="color: #6b7280; font-size: 11px; margin-bottom: 5px;">PRESCRIPTION ID</p>
            <p style="color: #0d9488; font-weight: bold; font-size: 14px;">${prescriptionData.prescriptionId || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #6b7280; font-size: 11px; margin-bottom: 5px;">ISSUE DATE</p>
            <p style="font-weight: 500; font-size: 14px;">${currentDate}</p>
          </div>
        </div>
        
        <!-- Doctor Information -->
        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #0d9488;">
          <h3 style="color: #166534; margin-bottom: 12px; font-size: 16px; font-weight: bold;">👨‍⚕️ Prescribing Doctor</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="color: #6b7280; font-size: 11px;">Doctor Name</p>
              <p style="font-weight: 600; font-size: 14px;">${doctorInfo?.name || 'N/A'}</p>
            </div>
            <div>
              <p style="color: #6b7280; font-size: 11px;">Specialization</p>
              <p style="font-size: 14px;">${doctorInfo?.specialization || 'N/A'}</p>
            </div>
            ${doctorInfo?.licenseNumber ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">License Number</p>
              <p style="font-size: 12px;">${doctorInfo.licenseNumber}</p>
            </div>
            ` : ''}
            ${doctorInfo?.hospital ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Hospital/Clinic</p>
              <p style="font-size: 12px;">${doctorInfo.hospital}</p>
            </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Patient Information -->
        <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin-bottom: 12px; font-size: 16px; font-weight: bold;">👤 Patient Information</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div>
              <p style="color: #6b7280; font-size: 11px;">Patient Name</p>
              <p style="font-weight: 600; font-size: 14px;">${selectedPatient?.name || 'N/A'}</p>
            </div>
            ${selectedPatient?.age ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Age</p>
              <p style="font-size: 14px;">${selectedPatient.age} years</p>
            </div>
            ` : ''}
            ${selectedPatient?.gender ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Gender</p>
              <p style="font-size: 14px;">${selectedPatient.gender}</p>
            </div>
            ` : ''}
            ${selectedPatient?.bloodGroup ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Blood Group</p>
              <p style="font-size: 14px; font-weight: 600;">${selectedPatient.bloodGroup}</p>
            </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Medicines Table -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; margin-bottom: 15px; font-size: 16px; font-weight: bold;">💊 Prescribed Medicines</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">#</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Medicine</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Dosage</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Frequency</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${medicines.map((med, idx) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 12px;">${idx + 1}</td>
                  <td style="padding: 10px 12px;"><strong>${med.name}</strong></td>
                  <td style="padding: 10px 12px;">${med.dosage || '—'}</td>
                  <td style="padding: 10px 12px;">${med.frequency || '—'}</td>
                  <td style="padding: 10px 12px;">${med.days || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${notes ? `
        <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-bottom: 10px; font-size: 14px; font-weight: bold;">📝 Additional Notes</h3>
          <p style="font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        ` : ''}
        
        <!-- Signature Section -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="color: #6b7280; font-size: 11px; margin-bottom: 5px;">Authorized Signature</p>
              ${signatureData ? `
                <div style="margin-top: 10px;">
                  <img src="${signatureData}" alt="Doctor's Signature" style="max-width: 200px; max-height: 80px; border: 1px solid #e5e7eb; padding: 5px; background: white;" />
                </div>
              ` : `
                <div style="margin-top: 10px;">
                  <div style="width: 200px; height: 60px; border-bottom: 1px solid #000;"></div>
                  <p style="font-size: 10px; color: #6b7280; margin-top: 5px;">Electronically generated prescription</p>
                </div>
              `}
            </div>
            <div style="text-align: right;">
              <p style="color: #6b7280; font-size: 10px;">Prescription is valid without signature</p>
              <p style="color: #6b7280; font-size: 10px; margin-top: 5px;">Dr. ${doctorInfo?.name || 'Doctor'}</p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #9ca3af;">
          <p>This is a computer-generated prescription. Please verify with your pharmacist.</p>
          <p>© ${new Date().getFullYear()} MediConnect Healthcare System • Prescription ID: ${prescriptionData.prescriptionId || 'N/A'}</p>
        </div>
      `;
      
      // Temporarily append to body
      document.body.appendChild(element);
      
      // PDF options
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `prescription_${prescriptionData.prescriptionId || 'new'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          letterRendering: true
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate and save PDF
      await html2pdf().set(opt).from(element).save();
      
      // Clean up
      document.body.removeChild(element);
      
      showToast('success', 'Prescription PDF generated successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      showToast('error', `Failed to generate PDF: ${error.message}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // ── Issue Prescription ─────────────────────────────────────
  const handleIssue = async () => {
    if (!selectedPatient || medicines.length === 0) {
      showToast('error', 'Please select a patient and add at least one medicine.');
      return;
    }
    if (!signatureData) {
      setShowSignaturePad(true);
      showToast('error', 'Please add your digital signature first');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(selectedPatient.id ? { patientId: selectedPatient.id } : {}),
        patientName: selectedPatient.name,
        patientAge: selectedPatient.age || null,
        patientGender: selectedPatient.gender || null,
        patientBloodGroup: selectedPatient.bloodGroup || null,
        medicines: medicines.map((m) => ({
          name: m.name, // Store clean name without dosage
          dosage: m.dosage, // Store dosage separately
          frequency: m.frequency,
          duration: m.days,
        })),
        notes,
        signatureData,
      };

      const res = await fetch(`${API_BASE}/prescriptions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        const prescriptionData = {
          prescriptionId: json.data.prescriptionId,
          id: json.data.id,
        };
        setIssuedPrescription(prescriptionData);
        setIssued(true);
        
        // Automatically generate PDF after successful issuance
        await generatePrescriptionPDF(prescriptionData);
      } else {
        showToast('error', json.message || 'Failed to issue prescription');
      }
    } catch (err) {
      showToast('error', 'Network error issuing prescription');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setIssued(false);
    setSelectedPatient(null);
    setMedicines([]);
    setNotes('');
    setSignatureData(null);
    setShowSignaturePad(false);
    setIssuedPrescription(null);
    // Clear canvas if it exists
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleDownloadPDF = async () => {
    if (issuedPrescription) {
      await generatePrescriptionPDF(issuedPrescription);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-teal-50/30 rounded-3xl p-8 overflow-auto">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl -z-10"></div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Loading overlay for PDF generation */}
      {generatingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/>
            <p className="text-gray-700 font-medium">Generating Prescription PDF...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Issue Digital Prescription
            </h1>
            <p className="text-gray-500 mt-1">Create and sign electronic prescriptions securely</p>
          </div>
        </div>

        {!issued ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: Patient Selection */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-8">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-xl font-semibold">Select Patient</h3>
                  </div>
                  <p className="text-teal-100 text-sm mt-1">Choose from your recent patients</p>
                </div>

                <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
                  {loadingPatients ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-teal-300 border-t-teal-600 rounded-full animate-spin"></div>
                    </div>
                  ) : patients.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <span className="text-4xl block mb-3">👤</span>
                      <p className="text-sm font-medium">No patients found</p>
                      <p className="text-xs mt-1">Patients appear here once appointments are confirmed</p>
                    </div>
                  ) : (
                    patients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`group relative cursor-pointer transition-all duration-300 ${
                          selectedPatient?.id === patient.id
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200'
                            : 'bg-gray-50 hover:bg-teal-50 border-2 border-transparent hover:border-teal-200'
                        } rounded-2xl p-4`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                            selectedPatient?.id === patient.id
                              ? 'bg-white/20 text-white'
                              : 'bg-teal-100 text-teal-700'
                          }`}>
                            {patient.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-lg truncate">{patient.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {patient.age && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  selectedPatient?.id === patient.id
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {patient.age} yrs
                                </span>
                              )}
                            </div>
                            {patient.lastVisit && (
                              <p className={`text-xs mt-1 ${
                                selectedPatient?.id === patient.id ? 'text-teal-100' : 'text-gray-500'
                              }`}>
                                Last visit: {patient.lastVisit}
                              </p>
                            )}
                          </div>
                          {selectedPatient?.id === patient.id && (
                            <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Prescription Builder */}
            <div className="lg:col-span-8">
              {selectedPatient ? (
                <div className="space-y-6">
                  {/* Doctor & Patient Info Bar */}
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-5 border border-teal-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white text-xl">
                            👨‍⚕️
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Prescribing Doctor</p>
                            <p className="font-semibold text-gray-800">
                              {doctorInfo?.name || 'Loading...'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {doctorInfo?.specialization} • {doctorInfo?.licenseNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500">Patient:</span>
                          <span className="font-semibold text-gray-800">{selectedPatient.name}</span>
                        </div>
                        {selectedPatient.age && (
                          <p className="text-xs text-gray-500">Age: {selectedPatient.age}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Medicine Form */}
                  <div className="bg-white rounded-3xl shadow-xl p-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 13H9L8 4z" />
                      </svg>
                      Add Medication
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <select
                          value={newMedicine.name}
                          onChange={(e) => {
                            const selected = commonMedicines.find(m => m.name === e.target.value);
                            if (selected) {
                              setNewMedicine({ 
                                ...newMedicine, 
                                name: selected.name,
                                dosage: selected.dosage
                              });
                            } else {
                              setNewMedicine({ ...newMedicine, name: e.target.value });
                            }
                          }}
                          className="w-full border-2 border-gray-200 focus:border-teal-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        >
                          <option value="">Select medicine</option>
                          {commonMedicines.map((med) => (
                            <option key={med.name} value={med.name}>
                              {med.name} {med.dosage}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Dosage (e.g., 5mg)"
                          value={newMedicine.dosage}
                          onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                          className="w-full border-2 border-gray-200 focus:border-teal-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Frequency (e.g., twice daily)"
                          value={newMedicine.frequency}
                          onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
                          className="w-full border-2 border-gray-200 focus:border-teal-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Duration (e.g., 7 days)"
                          value={newMedicine.days}
                          onChange={(e) => setNewMedicine({ ...newMedicine, days: e.target.value })}
                          className="w-full border-2 border-gray-200 focus:border-teal-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addMedicine}
                      className="mt-4 w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] shadow-lg"
                    >
                      + Add to Prescription
                    </button>
                  </div>

                  {/* Current Medicines List */}
                  {medicines.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-xl p-6">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Prescription Items ({medicines.length})
                        </span>
                      </h4>
                      <div className="space-y-3">
                        {medicines.map((med, idx) => (
                          <div key={med.id} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-xl p-4 group hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-teal-600 font-bold text-sm">#{idx + 1}</span>
                                <p className="font-semibold text-gray-800">{med.name}</p>
                                {med.dosage && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {med.dosage}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 ml-6">
                                {med.frequency && `${med.frequency}`}
                                {med.frequency && med.days && ' • '}
                                {med.days && `${med.days}`}
                              </p>
                            </div>
                            <button
                              onClick={() => removeMedicine(med.id)}
                              className="text-red-400 hover:text-red-600 transition-colors p-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div className="bg-white rounded-3xl shadow-xl p-6">
                    <label className="block font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Additional Instructions
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full border-2 border-gray-200 focus:border-teal-400 rounded-xl px-5 py-4 outline-none transition-all resize-none"
                      placeholder="Take after meals. Avoid alcohol. Follow up in 2 weeks..."
                    />
                  </div>

                  {/* Digital Signature Section */}
                  <div className="bg-white rounded-3xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Digital Signature
                      </h4>
                      <button
                        onClick={() => setShowSignaturePad(!showSignaturePad)}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        {showSignaturePad ? 'Hide Signature Pad' : 'Sign Here'}
                      </button>
                    </div>

                    {showSignaturePad && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Draw your signature below:</p>
                        <div className="border-2 border-teal-200 rounded-xl overflow-hidden bg-white">
                          <canvas
                            ref={canvasRef}
                            width={600}
                            height={200}
                            className="w-full h-40 cursor-crosshair"
                            style={{ touchAction: 'none' }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                        </div>
                        <div className="flex gap-3 mt-3 items-center">
                          <button
                            onClick={clearSignature}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            Clear Signature
                          </button>
                          {signatureData && (
                            <span className="text-xs text-emerald-600 font-medium">✓ Signature captured</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Display saved signature preview */}
                    {signatureData && !showSignaturePad && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-2">Doctor's Signature:</p>
                        <img src={signatureData} alt="Doctor's Signature" className="h-16 object-contain" />
                      </div>
                    )}

                    {!signatureData && !showSignaturePad && (
                      <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
                        ⚠️ A digital signature is required before issuing the prescription.
                      </p>
                    )}
                  </div>

                  {/* Issue Button */}
                  <button
                    onClick={handleIssue}
                    disabled={saving}
                    className="w-full py-5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white text-xl font-semibold rounded-2xl transition-all transform hover:scale-[1.02] shadow-xl disabled:opacity-60 disabled:transform-none"
                  >
                    <div className="flex items-center justify-center gap-3">
                      {saving ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Issuing Prescription...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Issue Digital Prescription
                        </>
                      )}
                    </div>
                  </button>
                </div>
              ) : (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                      <span className="text-6xl">👤</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-400">No Patient Selected</p>
                    <p className="text-gray-400 mt-2">Please select a patient to start prescribing</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Success Screen ── */
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center max-w-md mx-auto">
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-teal-400 to-teal-500 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-32 h-32 mx-auto bg-teal-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <h2 className="text-3xl font-bold text-teal-600 mb-3">Prescription Issued Successfully!</h2>
              <p className="text-gray-600">The prescription has been saved and the PDF has been generated.</p>
              <div className="mt-6 p-4 bg-teal-50 rounded-xl text-left space-y-2">
                <p className="text-sm text-teal-800">✓ Prescription ID: <strong>{issuedPrescription?.prescriptionId}</strong></p>
                <p className="text-sm text-teal-800">✓ Patient: <strong>{selectedPatient?.name}</strong></p>
                <p className="text-sm text-teal-800">✓ Digitally signed by <strong>{doctorInfo?.name}</strong></p>
                <p className="text-sm text-teal-800">✓ {medicines.length} medication(s) included</p>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleDownloadPDF}
                  disabled={generatingPdf}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {generatingPdf ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 border-2 border-teal-500 text-teal-600 py-3 rounded-xl font-semibold hover:bg-teal-50 transition-all"
                >
                  New Prescription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuePrescriptions;