const ChatHeader = ({ patientName }) => (
  <div className="px-8 py-5 border-b flex items-center justify-between bg-white ">
    <div className="flex items-center gap-x-3">
      <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-inner">
        🧬
      </div>
      <span className="text-2xl font-semibold tracking-tight text-gray-900">HealthAI</span>
      <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-3xl">Symptom Checker</span>
    </div>

    <div className="flex items-center gap-x-3">
      <div className="text-sm font-medium text-gray-600">Good evening, {patientName}</div>
      <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-semibold text-lg shadow-sm">
        K
      </div>
    </div>
  </div>
);

export default ChatHeader;