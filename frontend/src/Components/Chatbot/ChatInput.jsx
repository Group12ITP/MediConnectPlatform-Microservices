const ChatInput = ({ inputValue, setInputValue, onSend }) => (
  <div className="px-8 pb-8 pt-4 bg-white ">
    <div className="bg-white border border-gray-200 rounded-3xl px-5 py-2 flex items-center shadow-inner">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="Type your symptoms or question..."
        className="flex-1 bg-transparent outline-none text-base placeholder:text-gray-400"
      />
      <button
        onClick={onSend}
        className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 rounded-2xl flex items-center justify-center text-white transition-colors"
      >
        ↑
      </button>
    </div>

    <div className="flex justify-between text-[10px] text-gray-400 mt-4 px-3">
      <div>HealthAI can make mistakes. Please double-check responses.</div>
      <div>Use <span className="font-mono bg-gray-100 px-1 rounded">shift + return</span> for new line</div>
    </div>
  </div>
);

export default ChatInput;