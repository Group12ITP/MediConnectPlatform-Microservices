import SuggestionCard from './SuggestionCard';
import ChatInput from './ChatInput';

const WelcomeScreen = ({ patientName, onSuggestionClick, inputValue, setInputValue, onSend }) => {
  const suggestions = [
    { text: 'Describe my symptoms for AI analysis', icon: '🩺' },
    { text: 'Get preliminary health suggestions', icon: '🔍' },
    { text: 'Recommend doctor specialties', icon: '👨‍⚕️' },
    { text: 'Ask about possible conditions', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        {/* Header */}
        <div className="px-8 py-5 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-x-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-inner">🧬</div>
            <span className="text-2xl font-semibold tracking-tight text-gray-900">HealthAI</span>
          </div>
          <div className="flex items-center gap-x-3">
            <div className="text-sm font-medium text-gray-600">Good evening, {patientName}</div>
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-semibold text-lg shadow-sm">K</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gradient-to-b from-emerald-50 via-white to-white flex flex-col items-center justify-center px-6 relative">
          <div className="w-28 h-28 mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center shadow-[0_0_80px_-15px] shadow-emerald-500 relative">
            <div className="w-20 h-20 bg-white/30 backdrop-blur-xl rounded-full flex items-center justify-center text-7xl animate-pulse">🩺</div>
          </div>

          <h1 className="text-4xl font-semibold text-gray-900 mb-2 text-center">Good evening, {patientName}</h1>
          <p className="text-2xl text-gray-700 mb-2 text-center">Can I help you with anything?</p>
          

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                text={suggestion.text}
                icon={suggestion.icon}
                onClick={onSuggestionClick}
              />
            ))}
          </div>
            <div className="pt-8"> 
          <div className="absolute  bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-x-2 text-xs bg-white shadow rounded-3xl px-4 py-2 border ">
            <span className="text-emerald-600 font-medium">HealthAI 3.5 Smart</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400">Symptom Checker</span>
          </div>
          </div>
        </div>

        <ChatInput inputValue={inputValue} setInputValue={setInputValue} onSend={onSend} />
      </div>
    </div>
  );
};

export default WelcomeScreen;