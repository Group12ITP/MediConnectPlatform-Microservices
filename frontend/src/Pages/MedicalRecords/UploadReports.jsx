import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const patientHeaders = (isJson = false) => {
  const token = localStorage.getItem('patientToken');
  const h = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  if (isJson) h['Content-Type'] = 'application/json';
  return h;
};

const UploadReports = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const { t } = useLanguage();

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API}/reports/mine`, { headers: patientHeaders() });
      const json = await res.json();
      if (json.success) setFiles(json.data);
    } catch { showToast('error', 'Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const uploadFile = async (file, category = 'Other') => {
    const formData = new FormData();
    formData.append('report', file);
    formData.append('category', category);
    try {
      const res = await fetch(`${API}/reports/upload`, {
        method: 'POST',
        headers: patientHeaders(false), // no Content-Type; browser sets multipart boundary
        body: formData,
      });
      const json = await res.json();
      if (json.success) return json.data;
      throw new Error(json.message);
    } catch (e) { throw e; }
  };

  const handleFiles = async (fileList) => {
    setUploading(true);
    const pending = Array.from(fileList).map(f => ({ id: `pending-${Date.now()}-${f.name}`, originalName: f.name, size: f.size, status: 'uploading' }));
    setFiles(prev => [...pending, ...prev]);

    for (const file of Array.from(fileList)) {
      try {
        await uploadFile(file);
      } catch (e) {
        showToast('error', `Failed to upload ${file.name}: ${e.message}`);
      }
    }
    showToast('success', 'Files uploaded successfully');
    await fetchReports(); // refresh from server
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      const res = await fetch(`${API}/reports/${id}`, { method: 'DELETE', headers: patientHeaders() });
      const json = await res.json();
      if (json.success) { setFiles(prev => prev.filter(f => f._id !== id)); showToast('success', 'Report deleted'); }
      else showToast('error', json.message);
    } catch { showToast('error', 'Error deleting report'); }
  };

  const getFileIcon = (mime) => {
    if (!mime) return '📄';
    if (mime.includes('pdf')) return '📕';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('excel') || mime.includes('sheet')) return '📊';
    if (mime.includes('word')) return '📝';
    return '📄';
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now';

  return (
    <div className="h-full bg-white rounded-3xl shadow-inner p-8 overflow-auto">
      {toast && <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>{toast.msg}</div>}

      <h1 className="text-3xl font-semibold mb-8 text-gray-900">{t('medical.uploadTitle')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DROP ZONE */}
        <div
          className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}>
          <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-4xl mb-6">⬆️</div>
          <h3 className="text-2xl font-medium text-gray-800">{t('medical.chooseFile')}</h3>
          <p className="text-gray-500 mt-2 mb-6">{t('common.all')}</p>
          <button onClick={() => fileInputRef.current.click()} disabled={uploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-3xl font-medium transition-colors disabled:opacity-60">
            {uploading ? t('common.processing') : t('common.upload')}
          </button>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.png,.jpeg,.doc,.docx,.xls,.xlsx" className="hidden" onChange={e => handleFiles(e.target.files)} />
          <p className="text-xs text-gray-400 mt-6">{t('medical.fileTypes')}</p>
        </div>

        {/* FILE LIST */}
        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6">
          <h4 className="font-semibold text-gray-700 mb-4">{t('medical.myReports')} ({files.filter(f => f._id).length})</h4>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/></div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {files.map(file => (
                <div key={file._id || file.id}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm transition-all">
                  <div className="text-3xl">{getFileIcon(file.mimeType)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.originalName}</p>
                    <p className="text-xs text-gray-500">{formatSize(file.size)} • {formatDate(file.createdAt)} {file.category ? `• ${file.category}` : ''}</p>
                  </div>
                  {file.status === 'uploading' ? (
                    <div className="w-5 h-5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                  ) : (
                    <span className="text-emerald-500 text-lg">✅</span>
                  )}
                  {file._id && (
                    <button onClick={() => handleDelete(file._id)} className="text-gray-400 hover:text-red-500 text-xl transition-colors">✕</button>
                  )}
                </div>
              ))}
              {files.filter(f => f._id).length === 0 && !uploading && (
                <div className="text-center py-12 text-gray-400">{t('medical.noReports')}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadReports;