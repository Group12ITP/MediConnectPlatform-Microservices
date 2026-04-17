import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import html2pdf from 'html2pdf.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const patientHeaders = () => {
  const token = localStorage.getItem('patientToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const ViewPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { t } = useLanguage();

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API}/prescriptions/patient/mine`, { headers: patientHeaders() });
        const json = await res.json();
        if (json.success) setPrescriptions(json.data);
      } catch { showToast('error', 'Failed to load prescriptions'); }
      finally { setLoading(false); }
    };
    fetch_();
  }, []);

  const filtered = prescriptions.filter(p =>
    p.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prescriptionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColor = (s) => s === 'active'
    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'
    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  const handleView = (prescription) => {
    setSelectedPrescription(prescription);
    setModalOpen(true);
  };

  // Generate PDF using html2pdf (includes signature)
  const generatePrescriptionPDF = async (prescription) => {
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
      
      // Format current date for display
      const currentDate = new Date().toLocaleString();
      const issueDate = prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleString() : currentDate;
      
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
            <p style="color: #0d9488; font-weight: bold; font-size: 14px;">${prescription.prescriptionId || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #6b7280; font-size: 11px; margin-bottom: 5px;">ISSUE DATE</p>
            <p style="font-weight: 500; font-size: 14px;">${issueDate}</p>
          </div>
        </div>
        
        <!-- Doctor Information -->
        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #0d9488;">
          <h3 style="color: #166534; margin-bottom: 12px; font-size: 16px; font-weight: bold;">👨‍⚕️ Prescribing Doctor</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="color: #6b7280; font-size: 11px;">Doctor Name</p>
              <p style="font-weight: 600; font-size: 14px;">${prescription.doctor?.name || 'N/A'}</p>
            </div>
            <div>
              <p style="color: #6b7280; font-size: 11px;">Specialization</p>
              <p style="font-size: 14px;">${prescription.doctor?.specialization || 'N/A'}</p>
            </div>
            ${prescription.doctor?.licenseNumber ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">License Number</p>
              <p style="font-size: 12px;">${prescription.doctor.licenseNumber}</p>
            </div>
            ` : ''}
            ${prescription.doctor?.hospital ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Hospital/Clinic</p>
              <p style="font-size: 12px;">${prescription.doctor.hospital}</p>
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
              <p style="font-weight: 600; font-size: 14px;">${prescription.patient?.name || prescription.patientName || 'N/A'}</p>
            </div>
            ${prescription.patientAge ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Age</p>
              <p style="font-size: 14px;">${prescription.patientAge} years</p>
            </div>
            ` : ''}
            ${prescription.patientGender ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Gender</p>
              <p style="font-size: 14px;">${prescription.patientGender}</p>
            </div>
            ` : ''}
            ${prescription.patientBloodGroup ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Blood Group</p>
              <p style="font-size: 14px; font-weight: 600;">${prescription.patientBloodGroup}</p>
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
                <th style="padding: 12px; text-align: left; font-weight: 600;">Medicine</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Dosage</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Frequency</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${prescription.medicines?.map((med, idx) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 12px;">
                    <strong>${med.name}</strong>
                    ${med.genericName ? `<div style="font-size: 10px; color: #6b7280;">${med.genericName}</div>` : ''}
                  </td>
                  <td style="padding: 10px 12px;">${med.dosage || '—'}</td>
                  <td style="padding: 10px 12px;">${med.frequency || '—'}</td>
                  <td style="padding: 10px 12px;">${med.duration || '—'}</td>
                </tr>
              `).join('') || '<tr><td colspan="4" style="padding: 40px; text-align: center;">No medicines listed</td></tr>'}
            </tbody>
          </table>
        </div>
        
        ${prescription.medicines?.some(m => m.instructions) ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; margin-bottom: 10px; font-size: 14px; font-weight: bold;">📋 Instructions</h3>
          ${prescription.medicines.filter(m => m.instructions).map(m => `
            <div style="background: #fef3c7; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
              <strong>${m.name}:</strong> ${m.instructions}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${prescription.notes ? `
        <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-bottom: 10px; font-size: 14px; font-weight: bold;">📝 Additional Notes</h3>
          <p style="font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${prescription.notes}</p>
        </div>
        ` : ''}
        
        ${prescription.followUpDate ? `
        <div style="background: #f0fdf4; padding: 15px; border-radius: 12px; margin-bottom: 25px;">
          <h3 style="color: #166534; margin-bottom: 8px; font-size: 14px; font-weight: bold;">📅 Follow-up Date</h3>
          <p style="font-size: 13px;">${new Date(prescription.followUpDate).toLocaleDateString()}</p>
        </div>
        ` : ''}
        
        <!-- Signature Section -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="color: #6b7280; font-size: 11px; margin-bottom: 5px;">Authorized Signature</p>
              ${prescription.signatureData ? `
                <div style="margin-top: 10px;">
                  <img src="${prescription.signatureData}" alt="Doctor's Signature" style="max-width: 200px; max-height: 80px; border: 1px solid #e5e7eb; padding: 5px; background: white;" />
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
              <p style="color: #6b7280; font-size: 10px; margin-top: 5px;">Dr. ${prescription.doctor?.name || 'Doctor'}</p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 9px; color: #9ca3af;">
          <p>This is a computer-generated prescription. Please verify with your pharmacist.</p>
          <p>© ${new Date().getFullYear()} Healthcare System • Prescription ID: ${prescription.prescriptionId || 'N/A'}</p>
        </div>
      `;
      
      // Temporarily append to body
      document.body.appendChild(element);
      
      // PDF options
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `prescription_${prescription.prescriptionId || prescription._id}.pdf`,
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
      
      showToast('success', 'Prescription downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      showToast('error', `Failed to generate PDF: ${error.message}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // View PDF in new tab (using html2pdf)
  const handleViewPdf = async (prescription) => {
    setGeneratingPdf(true);
    try {
      showToast('info', 'Preparing PDF for viewing...');
      
      // Create a temporary container (same as download function)
      const element = document.createElement('div');
      element.style.padding = '40px';
      element.style.backgroundColor = 'white';
      element.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
      element.style.maxWidth = '800px';
      element.style.margin = '0 auto';
      element.style.lineHeight = '1.6';
      
      // Generate the same HTML content as above
      const currentDate = new Date().toLocaleString();
      const issueDate = prescription.issuedAt ? new Date(prescription.issuedAt).toLocaleString() : currentDate;
      
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #0d9488;">
          <h1 style="color: #0d9488; margin-bottom: 10px; font-size: 28px; font-weight: bold;">Medical Prescription</h1>
          <p style="color: #6b7280; font-size: 12px;">Generated on ${currentDate}</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <p style="color: #6b7280; font-size: 11px; margin-bottom: 5px;">PRESCRIPTION ID</p>
            <p style="color: #0d9488; font-weight: bold; font-size: 14px;">${prescription.prescriptionId || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #6b7280; font-size: 11px; margin-bottom: 5px;">ISSUE DATE</p>
            <p style="font-weight: 500; font-size: 14px;">${issueDate}</p>
          </div>
        </div>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #0d9488;">
          <h3 style="color: #166534; margin-bottom: 12px; font-size: 16px; font-weight: bold;">👨‍⚕️ Prescribing Doctor</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="color: #6b7280; font-size: 11px;">Doctor Name</p>
              <p style="font-weight: 600; font-size: 14px;">${prescription.doctor?.name || 'N/A'}</p>
            </div>
            <div>
              <p style="color: #6b7280; font-size: 11px;">Specialization</p>
              <p style="font-size: 14px;">${prescription.doctor?.specialization || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin-bottom: 12px; font-size: 16px; font-weight: bold;">👤 Patient Information</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
            <div>
              <p style="color: #6b7280; font-size: 11px;">Patient Name</p>
              <p style="font-weight: 600; font-size: 14px;">${prescription.patient?.name || prescription.patientName || 'N/A'}</p>
            </div>
            ${prescription.patientAge ? `
            <div>
              <p style="color: #6b7280; font-size: 11px;">Age</p>
              <p style="font-size: 14px;">${prescription.patientAge} years</p>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #374151; margin-bottom: 15px; font-size: 16px; font-weight: bold;">💊 Prescribed Medicines</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Medicine</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Dosage</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Frequency</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${prescription.medicines?.map((med, idx) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px 12px;"><strong>${med.name}</strong></td>
                  <td style="padding: 10px 12px;">${med.dosage || '—'}</td>
                  <td style="padding: 10px 12px;">${med.frequency || '—'}</td>
                  <td style="padding: 10px 12px;">${med.duration || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${prescription.notes ? `
        <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
          <h3 style="color: #92400e; margin-bottom: 10px; font-size: 14px; font-weight: bold;">📝 Notes</h3>
          <p style="font-size: 13px;">${prescription.notes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #d1d5db;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <p style="color: #6b7280; font-size: 11px;">Doctor's Signature</p>
              ${prescription.signatureData ? `
                <img src="${prescription.signatureData}" alt="Signature" style="max-width: 200px; max-height: 80px; border: 1px solid #e5e7eb; padding: 5px;" />
              ` : '<div style="width: 200px; height: 50px; border-bottom: 1px solid #000;"></div>'}
            </div>
            <div>
              <p style="font-size: 10px; color: #6b7280;">Dr. ${prescription.doctor?.name || 'Doctor'}</p>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(element);
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `prescription_${prescription.prescriptionId || prescription._id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      // Generate PDF as blob and open in new tab
      const worker = html2pdf().set(opt).from(element);
      const pdfBlob = await worker.outputPdf('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(element);
      }, 1000);
      
      showToast('success', 'PDF opened in new tab');
    } catch (error) {
      console.error('View PDF failed:', error);
      showToast('error', 'Failed to open PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 rounded-3xl p-8 overflow-auto">
      {toast && <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>{toast.msg}</div>}
      
      {/* Loading overlay for PDF generation */}
      {generatingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/>
            <p className="text-gray-700 font-medium">Generating PDF...</p>
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{t('medical.prescriptionsTitle')}</h1>
        <div className="relative w-full lg:w-96">
          <input type="text" placeholder="Search by doctor or prescription ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/80 border-2 border-gray-100 focus:border-emerald-400 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none" />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total', count: prescriptions.length, color: 'emerald' },
          { label: 'Active', count: prescriptions.filter(p => p.status === 'active').length, color: 'blue' },
          { label: 'Expired', count: prescriptions.filter(p => p.status !== 'active').length, color: 'purple' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br from-${s.color}-50 to-${s.color}-100/50 rounded-2xl p-4 border border-${s.color}-200`}>
            <p className={`text-${s.color}-600 text-sm font-medium`}>{s.label} Prescriptions</p>
            <p className={`text-2xl font-bold text-${s.color}-900`}>{s.count}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(p => (
            <div key={p._id} className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{p.prescriptionId}</p>
                    <p className="text-emerald-600 font-medium text-sm mt-1">{formatDate(p.issuedAt)}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${statusColor(p.status)}`}>{p.status}</span>
                </div>

                <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-2xl">
                  <p className="text-lg font-bold text-gray-800">{p.doctor?.name || 'Doctor'}</p>
                  <p className="text-emerald-600 text-sm font-medium mt-1">{p.doctor?.specialization}</p>
                </div>

                <div className="space-y-3 mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('medical.medicineName')}</p>
                  {p.medicines?.slice(0, 2).map((med, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 hover:bg-emerald-50 transition-colors">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{med.name}</p>
                          <p className="text-xs text-gray-500">{med.dosage} • {med.frequency}</p>
                        </div>
                        <p className="text-xs font-medium text-emerald-600">{med.duration}</p>
                      </div>
                    </div>
                  ))}
                  {p.medicines?.length > 2 && (
                    <p className="text-xs text-gray-400 text-center">+{p.medicines.length - 2} more medicines</p>
                  )}
                </div>

                {p.notes && (
                  <div className="mb-5 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg text-xs text-gray-600">📝 {p.notes.substring(0, 80)}{p.notes.length > 80 ? '...' : ''}</div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleView(p)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 shadow-lg"
                    disabled={generatingPdf}
                  >
                    {t('common.view')}
                  </button>
                  <button
                    onClick={() => generatePrescriptionPDF(p)}
                    className="flex-1 border-2 border-gray-200 hover:border-emerald-400 bg-white hover:bg-emerald-50 py-3 rounded-xl font-semibold text-sm text-gray-700 transition-all flex items-center justify-center gap-2"
                    disabled={generatingPdf}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <p className="text-2xl font-semibold text-gray-400">{t('medical.noPrescriptions')}</p>
        </div>
      )}

      {/* Modal for viewing prescription details */}
      {modalOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Prescription Details</h2>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{selectedPrescription.prescriptionId}</p>
                    <p className="text-emerald-600 text-sm mt-1">{formatDate(selectedPrescription.issuedAt)}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${statusColor(selectedPrescription.status)}`}>
                    {selectedPrescription.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Prescribed By</h3>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="font-bold text-gray-800 text-lg">{selectedPrescription.doctor?.name || 'Doctor'}</p>
                  <p className="text-emerald-600 text-sm">{selectedPrescription.doctor?.specialization}</p>
                  {selectedPrescription.doctor?.licenseNumber && (
                    <p className="text-gray-500 text-xs mt-1">License: {selectedPrescription.doctor.licenseNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Patient</h3>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="font-semibold text-gray-800">{selectedPrescription.patient?.name || selectedPrescription.patientName}</p>
                  {selectedPrescription.patientAge && <p className="text-gray-500 text-xs">Age: {selectedPrescription.patientAge}</p>}
                  {selectedPrescription.patientBloodGroup && <p className="text-gray-500 text-xs">Blood Group: {selectedPrescription.patientBloodGroup}</p>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Medicines Prescribed</h3>
                <div className="space-y-3">
                  {selectedPrescription.medicines?.map((med, i) => (
                    <div key={i} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-gray-800">{med.name}</p>
                        <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{med.duration}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Dosage</p>
                          <p className="text-gray-700 font-medium">{med.dosage}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Frequency</p>
                          <p className="text-gray-700 font-medium">{med.frequency}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.signatureData && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Doctor's Signature</h3>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <img 
                      src={selectedPrescription.signatureData} 
                      alt="Doctor's Signature" 
                      className="max-h-20 border border-gray-200 rounded p-2 bg-white"
                    />
                  </div>
                </div>
              )}

              {selectedPrescription.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Additional Notes</h3>
                  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedPrescription.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    generatePrescriptionPDF(selectedPrescription);
                    setModalOpen(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  disabled={generatingPdf}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    handleViewPdf(selectedPrescription);
                    setModalOpen(false);
                  }}
                  className="flex-1 border-2 border-gray-200 hover:border-emerald-400 bg-white hover:bg-emerald-50 py-3 rounded-xl font-semibold text-gray-700 transition-all flex items-center justify-center gap-2"
                  disabled={generatingPdf}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  View PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPrescriptions;