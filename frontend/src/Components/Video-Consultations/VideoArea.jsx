const VideoArea = ({ timeLeft }) => (
  <div className="relative flex-1 bg-gray-900 flex items-center justify-center overflow-hidden">
    {/* Main Video Feed */}
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Placeholder video (replace with real <video> or Agora later) */}
      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex flex-col items-center justify-center text-white">
        <div className="text-8xl mb-6">👵</div>
        <p className="text-3xl font-medium">Olivia Wild</p>
        <p className="text-sm mt-2 opacity-75">Live Video Consultation</p>
      </div>

      {/* Time Remaining Badge */}
      <div className="absolute top-6 left-6 bg-black/70 text-white text-sm font-medium px-4 py-1.5 rounded-3xl flex items-center gap-x-2">
        <span className="text-red-400">●</span>
        Time remaining
        <span className="font-mono">{timeLeft}</span>
      </div>

      {/* Picture-in-Picture (Doctor) */}
      <div className="absolute top-6 right-6 w-40 h-40 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-white">
        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-6xl">
          👩🏻‍⚕️
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-xl">Dr. Lopez</div>
      </div>
    </div>

    {/* Bottom Call Controls */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-x-4 bg-black/70 px-6 py-3 rounded-3xl">
      <button className="w-10 h-10 flex items-center justify-center text-white text-2xl hover:bg-white/20 rounded-2xl transition-colors">📹</button>
      <button className="w-10 h-10 flex items-center justify-center text-white text-2xl hover:bg-white/20 rounded-2xl transition-colors">🎤</button>
      <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-3xl font-medium flex items-center gap-x-2 transition-colors">
        <span>📞</span>
        Leave
      </button>
    </div>
  </div>
);

export default VideoArea;