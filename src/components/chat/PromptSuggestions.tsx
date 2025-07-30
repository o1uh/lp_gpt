interface PromptSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const PromptSuggestions = ({ suggestions, onSuggestionClick }: PromptSuggestionsProps) => {
  // Если нет подсказок, ничего не рендерим
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => {
        const isCompleteButton = suggestion.toLowerCase().includes('завершить');
        return (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isCompleteButton 
                ? 'bg-green-600 hover:bg-green-700 text-white font-semibold' 
                : 'bg-gray-700/50 hover:bg-gray-700 text-gray-200'
            }`}
          >
            {suggestion}
          </button>
        )
      })}
    </div>
  );
};