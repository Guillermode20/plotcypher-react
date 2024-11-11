import PropTypes from 'prop-types';
import { useMemo, useState, useEffect, useRef } from 'react';

const SuggestionsDropdown = ({ suggestions, searchInput, selectedDescription, onSelect, dropdownDirection, onKeyDown }) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const filteredSuggestions = useMemo(() => {
    if (!searchInput || searchInput.length < 1 || !selectedDescription) return [];
      
    const categorySuggestions = suggestions[selectedDescription === 'tv' ? 'tv' : 
                                selectedDescription === 'movie' ? 'movies' : 
                                'games'];
    
    if (!categorySuggestions) return [];
      
    const searchQuery = searchInput.toLowerCase();
    const maxResults = 10;
    let results = [];
      
    const exactMatch = categorySuggestions.find(item => 
      item && item.toLowerCase() === searchQuery
    );
    if (exactMatch) return [exactMatch];
  
    categorySuggestions.forEach(item => {
      if (results.length >= maxResults) return;
      if (item && item.toLowerCase().startsWith(searchQuery)) {
        results.push(item);
      }
    });
  
    if (results.length < maxResults) {
      categorySuggestions.forEach(item => {
        if (results.length >= maxResults) return;
        if (item && !item.toLowerCase().startsWith(searchQuery) && 
            item.toLowerCase().includes(searchQuery) &&
            !results.includes(item)) {
          results.push(item);
        }
      });
    }
  
    return results;
  }, [searchInput, selectedDescription, suggestions]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredSuggestions]);

  useEffect(() => {
    if (dropdownRef.current && highlightedIndex >= 0) {
      const highlightedItem = dropdownRef.current.children[highlightedIndex];
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!filteredSuggestions.length) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prevIndex) => 
          prevIndex < filteredSuggestions.length - 1 ? prevIndex + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prevIndex) => 
          prevIndex > 0 ? prevIndex - 1 : filteredSuggestions.length - 1
        );
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        onSelect(filteredSuggestions[highlightedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredSuggestions, highlightedIndex, onSelect]);

  return (
    <ul
      ref={dropdownRef}
      className={`absolute left-0 right-0 ${dropdownDirection === 'up' ? 'bottom-[calc(100%+0.5rem)]' : 'top-[calc(100%+0.5rem)]'} border border-white/30 rounded-md bg-zinc-950/90 backdrop-blur-sm shadow-lg max-h-60 overflow-y-auto z-50 divide-y divide-white/10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb]:hover:bg-white/30`}
      role="listbox"
      aria-label="Suggestions"
    >
      {filteredSuggestions.map((item, index) => (
        <li
          key={index}
          className={`px-4 py-2 cursor-pointer text-white/70 hover:text-white hover:bg-zinc-800/70 transition-all duration-200 block w-full text-left ${highlightedIndex === index ? 'bg-zinc-800/70 text-white' : ''}`}
          onClick={() => onSelect(item)}
          role="option"
          aria-selected={highlightedIndex === index}
          onMouseEnter={() => setHighlightedIndex(index)}
        >
          {item}
        </li>
      ))}
    </ul>
  );
};

SuggestionsDropdown.propTypes = {
  suggestions: PropTypes.object.isRequired,
  searchInput: PropTypes.string.isRequired,
  selectedDescription: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  dropdownDirection: PropTypes.string.isRequired,
  onKeyDown: PropTypes.func,
};

export default SuggestionsDropdown;