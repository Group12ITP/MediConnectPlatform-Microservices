import { useState } from 'react';

const ChatPanel = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'Patient' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-3xl ${msg.sender === 'Patient' ? 'bg-emerald-600 text-white' : 'bg-white shadow-sm'}`}>
              <p className="text-sm">{msg.text}</p>
              <span className="text-[10px] opacity-70 block mt-1 text-right">{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex items-center bg-gray-100 rounded-3xl px-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write your message..."
            className="flex-1 bg-transparent py-3 outline-none text-sm"
          />
          <button type="submit" className="text-emerald-600 text-2xl">↑</button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;