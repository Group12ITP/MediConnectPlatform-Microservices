const PatientInfoPanel = () => (
  <div className="p-5 border-b bg-white">
    <div className="flex items-center gap-x-3">
      <div className="w-12 h-12 bg-gray-200 rounded-2xl overflow-hidden flex items-center justify-center text-3xl">👵</div>
      <div>
        <h3 className="font-semibold text-xl">Olivia Wild</h3>
        <p className="text-gray-500 text-sm">Female • 81 y.o.</p>
      </div>
    </div>

    {/* Tabs */}
    <div className="flex gap-x-6 mt-6 text-sm font-medium border-b pb-2">
      <button className="text-emerald-600 border-b-2 border-emerald-600 pb-1">Record</button>
      <button className="text-gray-600 hover:text-gray-900">Chat</button>
      <button className="text-gray-600 hover:text-gray-900">Notes</button>
      <button className="text-gray-600 hover:text-gray-900">Docs</button>
    </div>
  </div>
);
export default PatientInfoPanel;