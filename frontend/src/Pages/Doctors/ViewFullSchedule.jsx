import { useState, useEffect, useCallback } from 'react';
import html2pdf from 'html2pdf.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('doctorToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const ViewFullSchedule = () => {
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduleData, setScheduleData] = useState([]);
  const [stats, setStats] = useState({ totalAppointments: 0, freeSlots: 0, uniquePatients: 0, completionRate: 0 });
  const [filterType, setFilterType] = useState('all'); // 'all', 'confirmed', 'free'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) daysArray.push(null);
    for (let i = 1; i <= days; i++) {
      daysArray.push(new Date(year, month, i));
    }
    return daysArray;
  };

  const getWeekDates = useCallback(() => {
  const today = selectedDate || new Date();
  // Create a new date object and set to noon to avoid timezone issues
  const startDate = new Date(today);
  startDate.setHours(12, 0, 0, 0); // Set to noon to avoid DST issues
  
  // Get the day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = startDate.getDay();
  // Calculate the start of the week (Sunday)
  const startOfWeek = new Date(startDate);
  startOfWeek.setDate(startDate.getDate() - dayOfWeek);
  startOfWeek.setHours(12, 0, 0, 0); // Keep at noon
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    date.setHours(12, 0, 0, 0); // Keep all dates at noon
    weekDates.push(date);
  }
  return weekDates;
}, [selectedDate]);

  // Fetch schedule data from API
  const loadScheduleData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const url = `${API_BASE}/schedule?viewMode=${viewMode}&date=${dateStr}&year=${year}&month=${month}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const json = await res.json();

      if (json.success) {
        setScheduleData(json.data.schedule || []);
      } else {
        showToast('error', json.message || 'Failed to load schedule');
      }
    } catch (err) {
      showToast('error', 'Network error loading schedule');
    } finally {
      setLoading(false);
    }
  }, [viewMode, currentMonth, selectedDate]);

  // Fetch stats
  const loadStats = useCallback(async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const paddedMonth = String(month).padStart(2, '0');
      const lastDay = new Date(year, month, 0).getDate();
      const startDate = `${year}-${paddedMonth}-01`;
      const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

      const res = await fetch(`${API_BASE}/schedule/stats?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Build a lookup map from loaded schedule
  const scheduleLookup = scheduleData.reduce((acc, day) => {
    acc[day.date] = day;
    return acc;
  }, {});

  const getFilteredSlots = (slots = []) => {
    if (filterType === 'all') return slots;
    if (filterType === 'confirmed') return slots.filter((slot) => slot.status === 'confirmed');
    if (filterType === 'free') return slots.filter((slot) => slot.status === 'free');
    return slots;
  };

  const getStatusBadge = (status, type) => {
    if (status === 'confirmed') {
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-emerald-700">Confirmed</span>
          <span className="text-xs text-gray-400">{type}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-xs font-medium text-gray-500">Available Slot</span>
      </div>
    );
  };

  const handleJoinCall = (patient) => {
    alert(`Initiating video call with ${patient}...`);
  };

  const handleReschedule = (time, patient) => {
    alert(`Reschedule appointment at ${time} with ${patient || 'available slot'}`);
  };

 const exportSchedule = async () => {
  setLoading(true);
  try {
    showToast('info', 'Preparing PDF...');
    
    // Create a temporary container
    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.backgroundColor = 'white';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.maxWidth = '1200px';
    element.style.margin = '0 auto';
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Add header
    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0d9488;">
        <h1 style="color: #0d9488; margin-bottom: 10px; font-size: 28px;">Doctor's Schedule</h1>
        <p style="color: #6b7280; font-size: 14px;">Generated on ${new Date().toLocaleString()}</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 5px;">View Mode: ${viewMode} | Filter: ${filterType}</p>
      </div>
    `;
    
    // Add stats
    element.innerHTML += `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px;">
        <div style="padding: 16px; background: #f0fdf4; border-radius: 8px;">
          <p style="font-size: 12px; color: #166534;">Total Appointments</p>
          <p style="font-size: 24px; font-weight: bold; color: #166534;">${stats.totalAppointments}</p>
        </div>
        <div style="padding: 16px; background: #eff6ff; border-radius: 8px;">
          <p style="font-size: 12px; color: #1e40af;">Free Slots</p>
          <p style="font-size: 24px; font-weight: bold; color: #1e40af;">${stats.freeSlots}</p>
        </div>
        <div style="padding: 16px; background: #faf5ff; border-radius: 8px;">
          <p style="font-size: 12px; color: #4c1d95;">Unique Patients</p>
          <p style="font-size: 24px; font-weight: bold; color: #4c1d95;">${stats.uniquePatients}</p>
        </div>
        <div style="padding: 16px; background: #fffbeb; border-radius: 8px;">
          <p style="font-size: 12px; color: #92400e;">Completion Rate</p>
          <p style="font-size: 24px; font-weight: bold; color: #92400e;">${stats.completionRate}%</p>
        </div>
      </div>
    `;
    
    // Generate schedule HTML from data instead of cloning DOM
    const scheduleHtml = await generateScheduleHTML();
    element.innerHTML += scheduleHtml;
    
    // Add footer
    element.innerHTML += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #9ca3af;">
        <p>This is an automatically generated document from Doctor's Schedule System</p>
        <p>© ${new Date().getFullYear()} All Rights Reserved</p>
      </div>
    `;
    
    // Temporarily append to body
    document.body.appendChild(element);
    
    // PDF options
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `schedule_${currentDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate and save PDF
    await html2pdf().set(opt).from(element).save();
    
    // Clean up
    document.body.removeChild(element);
    
    showToast('success', 'Schedule exported successfully!');
  } catch (error) {
    console.error('Export failed:', error);
    showToast('error', `Export failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// Helper function to generate schedule HTML from data
const generateScheduleHTML = async () => {
  let html = '';
  
  if (viewMode === 'day' && selectedDate) {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayData = scheduleLookup[dateStr];
    const slots = getFilteredSlots(dayData?.slots || []);
    
    html = `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #374151;">
          ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        ${slots.map(slot => `
          <div style="padding: 16px; margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: ${slot.status === 'confirmed' ? '#f0fdf4' : '#f9fafb'}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 18px; font-weight: bold; color: #0d9488;">${slot.time}</div>
                <div style="font-size: 12px; color: #6b7280;">${slot.duration} min</div>
              </div>
              ${slot.patient ? `
                <div style="text-align: right;">
                  <div style="font-weight: 600;">${slot.patient}</div>
                  <div style="font-size: 12px; color: #6b7280;">${slot.type}</div>
                </div>
              ` : '<div style="color: #9ca3af;">Available Slot</div>'}
            </div>
          </div>
        `).join('')}
        ${slots.length === 0 ? '<div style="text-align: center; color: #9ca3af; padding: 40px;">No appointments for this day</div>' : ''}
      </div>
    `;
  }
  
  else if (viewMode === 'week') {
    const weekDates = getWeekDates();
    html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px;">';
    
    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayData = scheduleLookup[dateStr];
      const slots = getFilteredSlots(dayData?.slots || []);
      
      html += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: #f9fafb; padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600;">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div style="font-size: 20px; font-weight: bold; color: #0d9488;">${date.getDate()}</div>
          </div>
          <div style="padding: 12px;">
            ${slots.slice(0, 3).map(slot => `
              <div style="font-size: 12px; padding: 8px; margin-bottom: 8px; background: #f9fafb; border-radius: 6px;">
                <div style="font-weight: 600; color: #0d9488;">${slot.time}</div>
                ${slot.patient ? `<div>${slot.patient}</div>` : '<div style="color: #9ca3af;">Available</div>'}
              </div>
            `).join('')}
            ${slots.length > 3 ? `<div style="font-size: 11px; color: #6b7280; text-align: center;">+${slots.length - 3} more</div>` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  else if (viewMode === 'month') {
    html = scheduleData.map(day => {
      const slots = getFilteredSlots(day.slots || []);
      if (slots.length === 0) return '';
      
      return `
        <div style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0d9488, #0f766e); padding: 16px; color: white;">
            <div style="font-size: 18px; font-weight: bold;">${day.day}</div>
            <div style="font-size: 14px; opacity: 0.9;">${day.date}</div>
          </div>
          <div style="padding: 16px;">
            ${slots.map(slot => `
              <div style="padding: 12px; margin-bottom: 8px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    <div style="font-weight: bold; color: #0d9488;">${slot.time}</div>
                    ${slot.patient ? `<div>${slot.patient}</div>` : '<div style="color: #9ca3af;">Available</div>'}
                  </div>
                  <div style="font-size: 12px;">${slot.type || 'Consultation'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
    
    if (!html) {
      html = '<div style="text-align: center; color: #9ca3af; padding: 60px;">No schedule data for this month</div>';
    }
  }
  
  return html;
};

  const days = getDaysInMonth(currentMonth);
  const weekDates = getWeekDates();

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-teal-50/30 rounded-3xl p-8 overflow-auto">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl -z-10"></div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                My Schedule
              </h1>
              <p className="text-gray-500 mt-1">View and manage your appointments</p>
            </div>
          </div>

          <div className="flex gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {['day', 'week', 'month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all capitalize ${
                    viewMode === mode
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-teal-400"
              >
                <option value="all">All Appointments</option>
                <option value="confirmed">Confirmed Only</option>
                <option value="free">Free Slots Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl p-4 border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-600 text-sm font-medium">Total Appointments</p>
                <p className="text-2xl font-bold text-teal-900">{stats.totalAppointments}</p>
              </div>
              <div className="w-10 h-10 bg-teal-200 rounded-full flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Free Slots</p>
                <p className="text-2xl font-bold text-blue-900">{stats.freeSlots}</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-xl">🕐</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Unique Patients</p>
                <p className="text-2xl font-bold text-purple-900">{stats.uniquePatients}</p>
              </div>
              <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Completion Rate</p>
                <p className="text-2xl font-bold text-amber-900">{stats.completionRate}%</p>
              </div>
              <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendar Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500 mb-3">
                  {weekDays.map((day) => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    if (!day) return <div key={index} className="h-10"></div>;
                    const dateStr = day.toISOString().split('T')[0];
                    const hasAppointments = scheduleLookup[dateStr]?.slots?.some((slot) => slot.status === 'confirmed');
                    const isToday = new Date().toDateString() === day.toDateString();

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          relative h-10 rounded-xl flex items-center justify-center text-sm transition-all
                          ${hasAppointments ? 'bg-teal-100 text-teal-700 font-semibold' : 'hover:bg-gray-100'}
                          ${isToday ? 'ring-2 ring-teal-400' : ''}
                        `}
                      >
                        {day.getDate()}
                        {hasAppointments && (
                          <div className="absolute bottom-1 w-1 h-1 bg-teal-500 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule View */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-teal-300 border-t-teal-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {viewMode === 'day' && selectedDate && (
                  <DayView
                    date={selectedDate}
                    scheduleData={scheduleLookup}
                    getFilteredSlots={getFilteredSlots}
                    getStatusBadge={getStatusBadge}
                    handleJoinCall={handleJoinCall}
                    handleReschedule={handleReschedule}
                  />
                )}

                {viewMode === 'week' && (
                  <WeekView
                    weekDates={weekDates}
                    scheduleData={scheduleLookup}
                    getFilteredSlots={getFilteredSlots}
                    getStatusBadge={getStatusBadge}
                    handleJoinCall={handleJoinCall}
                    handleReschedule={handleReschedule}
                  />
                )}

                {viewMode === 'month' && (
                  <MonthView
                    scheduleData={scheduleData}
                    getFilteredSlots={getFilteredSlots}
                    getStatusBadge={getStatusBadge}
                    handleJoinCall={handleJoinCall}
                    handleReschedule={handleReschedule}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={exportSchedule}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-2xl font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Schedule as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// Day View Component
const DayView = ({ date, scheduleData, getFilteredSlots, getStatusBadge, handleJoinCall, handleReschedule }) => {
  const dateStr = date.toISOString().split('T')[0];
  const dayData = scheduleData[dateStr];
  const slots = getFilteredSlots(dayData?.slots || []);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        <p className="text-gray-500 mt-1">{slots.length} appointments scheduled</p>
      </div>

      <div className="space-y-4">
        {slots.length > 0 ? slots.map((slot, idx) => (
          <AppointmentCard key={idx} slot={slot} getStatusBadge={getStatusBadge} handleJoinCall={handleJoinCall} handleReschedule={handleReschedule} />
        )) : (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No appointments for this day</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Week View Component - FIXED to properly show today's schedule
const WeekView = ({ weekDates, scheduleData, getFilteredSlots, getStatusBadge, handleJoinCall, handleReschedule }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDates.map((date, idx) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayData = scheduleData[dateStr];
          const slots = getFilteredSlots(dayData?.slots || []);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div key={idx} className="bg-white min-h-[400px]">
              <div className={`p-4 border-b ${isToday ? 'bg-gradient-to-r from-teal-50 to-teal-100' : 'bg-gradient-to-r from-gray-50 to-blue-50'}`}>
                <p className="font-semibold text-gray-800">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className={`text-2xl font-bold ${isToday ? 'text-teal-600' : 'text-gray-700'}`}>{date.getDate()}</p>
                {isToday && <p className="text-xs text-teal-600 font-medium mt-1">Today</p>}
                <p className="text-xs text-gray-500 mt-1">{slots.length} slots</p>
              </div>
              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {slots.length > 0 ? (
                  slots.map((slot, slotIdx) => (
                    <div key={slotIdx} className={`text-sm p-2 rounded-lg ${slot.status === 'confirmed' ? 'bg-teal-50 border-l-4 border-teal-500' : 'bg-gray-50'}`}>
                      <div className="font-mono font-bold text-teal-600">{slot.time}</div>
                      {slot.patient ? (
                        <>
                          <div className="font-medium text-gray-800 truncate">{slot.patient}</div>
                          <div className="text-xs text-gray-500">{slot.type}</div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 italic">Available</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No slots available
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Month View Component
const MonthView = ({ scheduleData, getFilteredSlots, getStatusBadge, handleJoinCall, handleReschedule }) => {
  return (
    <div className="space-y-6">
      {scheduleData.map((day) => {
        const slots = getFilteredSlots(day.slots || []);
        if (slots.length === 0) return null;

        return (
          <div key={day.date} className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{day.day}</h3>
                  <p className="text-teal-100">{day.date}</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {slots.length} appointments
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.map((slot, idx) => (
                  <AppointmentCard key={idx} slot={slot} getStatusBadge={getStatusBadge} handleJoinCall={handleJoinCall} handleReschedule={handleReschedule} />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {scheduleData.filter((day) => (day.slots || []).length > 0).length === 0 && (
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium">No schedule data for this month</p>
          <p className="text-sm mt-1">Set your availability to see appointments here</p>
        </div>
      )}
    </div>
  );
};

// Reusable Appointment Card Component
const AppointmentCard = ({ slot, getStatusBadge, handleJoinCall, handleReschedule }) => (
  <div className={`rounded-2xl p-5 transition-all hover:shadow-lg ${
    slot.status === 'free'
      ? 'border-2 border-dashed border-gray-200 bg-gray-50'
      : 'border-2 border-teal-100 bg-gradient-to-r from-white to-teal-50/30'
  }`}>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="text-center">
          <div className="font-mono text-2xl font-bold text-teal-600">{slot.time}</div>
          <div className="text-xs text-gray-400">{slot.duration} min</div>
        </div>

        {slot.patient ? (
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 text-lg">{slot.patient}</p>
              {slot.age && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{slot.age} yrs</span>}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-teal-600">{slot.type} Consultation</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-medium text-gray-400 italic">Available Time Slot</p>
            <p className="text-xs text-gray-400 mt-1">No patient assigned</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {slot.status === 'confirmed' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleJoinCall(slot.patient)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all"
            >
              Join Call
            </button>
            <button
              onClick={() => handleReschedule(slot.time, slot.patient)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all"
            >
              Reschedule
            </button>
          </div>
        )}

        {slot.status === 'free' && (
          <button
            onClick={() => handleReschedule(slot.time, null)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-medium transition-all"
          >
            Block Slot
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ViewFullSchedule;