import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

const SuggestionsDropdown = memo(({ suggestions, searchInput, selectedDescription, onSelect, dropdownDirection }) => {
  const filteredSuggestions = useMemo(() => {
    if (!searchInput || !suggestions[selectedDescription]) return [];
    
    return suggestions[selectedDescription]
      .filter(item => 
        item.toLowerCase().includes(searchInput.toLowerCase())
      )
      .slice(0, 5);
  }, [searchInput, selectedDescription, suggestions]);

  if (!filteredSuggestions.length) return null;

  return (
    <div className={`absolute ${dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 w-full max-h-60 overflow-y-auto bg-zinc-950/90 border border-white/30 rounded-md shadow-lg z-50`}>
      {filteredSuggestions.map((item, index) => (
        <button
          key={index}
          className="w-full px-4 py-2 text-left text-white/90 hover:bg-zinc-800/50 focus:outline-none focus:bg-zinc-800/50 transition-colors duration-200"
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
});

SuggestionsDropdown.propTypes = {
  suggestions: PropTypes.object.isRequired,
  searchInput: PropTypes.string.isRequired,
  selectedDescription: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  dropdownDirection: PropTypes.string.isRequired
};

SuggestionsDropdown.displayName = 'SuggestionsDropdown';

export default SuggestionsDropdown;