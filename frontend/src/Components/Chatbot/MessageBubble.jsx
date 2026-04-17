const MessageBubble = ({ message }) => (
  <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[70%] px-5 py-3.5 rounded-3xl ${
        message.type === 'user'
          ? 'bg-emerald-600 text-white rounded-br-none'
          : 'bg-white border shadow-sm rounded-bl-none'
      }`}
    >
      <p className="text-base leading-relaxed">{message.text}</p>
      <span className="text-[10px] opacity-70 mt-1 block text-right">{message.time}</span>
    </div>
  </div>
);

export default MessageBubble;