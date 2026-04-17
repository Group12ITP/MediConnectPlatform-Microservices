const Toolbar = () => (
  <div className="h-16 border-t bg-white flex items-center px-6 gap-x-3 overflow-x-auto">
    {['Record', 'Share screen', 'Subtitles', 'White board', 'Meeting plan', 'Exercise', 'Slides', 'More'].map((tool, i) => (
      <button
        key={i}
        className="flex flex-col items-center justify-center min-w-[68px] hover:bg-gray-100 py-1 px-2 rounded-2xl transition-colors"
      >
        <span className="text-2xl mb-1">
          {['📹', '🖥️', '📝', '📋', '📅', '🏋️', '📑', '⋯'][i]}
        </span>
        <span className="text-xs font-medium text-gray-600">{tool}</span>
      </button>
    ))}
  </div>
);

export default Toolbar;