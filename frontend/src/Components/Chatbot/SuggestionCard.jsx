const SuggestionCard = ({ text, icon, onClick }) => (
  <button
    onClick={() => onClick(text)}
    className="group bg-white hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-2xl p-6 text-left transition-all duration-200 shadow-sm hover:shadow-md flex flex-col items-start gap-y-3"
  >
    <span className="text-3xl">{icon}</span>
    <p className="text-gray-800 font-medium leading-tight group-hover:text-emerald-700">{text}</p>
  </button>
);

export default SuggestionCard;