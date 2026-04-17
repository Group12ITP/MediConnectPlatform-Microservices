import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const ChatScreen = ({ messages, isTyping, chatContainerRef, inputValue, setInputValue, onSend }) => (
  <>
    {/* Messages Area */}
    <div
      ref={chatContainerRef}
      className="flex-1 p-8 overflow-y-auto space-y-6 bg-gradient-to-b from-emerald-50/30 to-white"
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-white border shadow-sm rounded-3xl px-5 py-3.5 max-w-[70%] flex items-center gap-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-gray-500">HealthAI is thinking...</span>
          </div>
        </div>
      )}
    </div>

    {/* Input */}
    <ChatInput inputValue={inputValue} setInputValue={setInputValue} onSend={onSend} />
  </>
);

export default ChatScreen;