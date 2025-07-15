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
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-sm text-gray-200 rounded-lg transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};