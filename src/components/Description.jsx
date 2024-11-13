import { useState, useEffect } from 'react';
import { getItemById  } from '../database';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';

const symbols = ['#', '£', '$', '%', '&', '@'];

const hash = (text, level) => {
  const sentences = text.split('.')
    .filter(s => s.trim())
    .map(s => s.trim() + '.');
  
  const seed = 12345;
  let value = seed;
  const prng = () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
  const visibleSentences = 5 - level;
  
  return sentences.map((sentence, index) => {
    if (index < visibleSentences) {
      return sentence;
    } else {
      return sentence.split('').map(char => {
        if ([' ', '.', ',', ';', ':', '"', "'", '-', '(', ')', '[', ']', '?', '!'].includes(char)) {
          return char;
        }
        const hashedIndex = Math.floor(prng() * symbols.length);
        return symbols[hashedIndex];
      }).join('');
    }
  });
};

const applyOpacity = (textArray) => {
  return textArray.map((sentence, sentenceIndex) => (
    <div key={sentenceIndex} className="flex items-start space-x-2 mb-2">
      <span className="text-white/70">•</span>
      <span>
        {sentence.split('').map((char, index) => {
          if (symbols.includes(char)) {
            return <span key={index} className="text-white/50 font-mono">{char}</span>;
          }
          return <span key={index} className="font-mono">{char}</span>;
        })}
      </span>
    </div>
  ));
};

const getItemIdByDate = (startDate) => {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return (diffDays % 30) + 1;
};

function Description(props) {
  const { onDataLoad, level, startDate, category } = props;
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState({
    name: '',
    description: '',
    releaseYear: '', 
    genre: '',
    id: null
  });
  const [incorrectNames, setIncorrectNames] = useState([]);
  const hashedDescription = details.description ? hash(details.description, level) : [];  
  const itemId = getItemIdByDate(startDate);

  const LoadingSkeleton = () => (
    <div className="border border-white/30 p-4 bg-zinc-950/70 rounded-md">
      <div className="space-y-4">
        <div className="h-6 bg-white/10 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-white/10 rounded animate-pulse w-1/4 mt-4"></div>
        <div className="h-4 bg-white/10 rounded animate-pulse w-1/3 mt-2"></div>
        <div className="space-y-2 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-white/10 animate-pulse"></div>
              <div className="h-4 bg-white/10 rounded animate-pulse w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const itemId = getItemIdByDate(startDate);
        const item = await getItemById(category, itemId);
        if (!item) {
          console.error(`No item found for category ${category} with ID ${itemId}`);
          return;
        }

        setDetails({
          name: item.Name,
          description: item.Description,
          releaseYear: item.ReleaseYear || item.Year, // Handle both field names
          genre: item.Genres,
          id: item.ID,
        });

        // Get the correct data file path based on category
        const dataPath = category === 'game' ? 'videogames.json' : 
                         category === 'tv' ? 'tvshows.json' : 
                         'movies.json';
                         
        const response = await fetch(`/data/${dataPath}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const allItems = await response.json();
        const names = allItems
          .filter(i => i && i.Name && typeof i.Name === 'string')
          .map(i => i.Name)
          .slice(0, 100);

        setIncorrectNames(names);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIncorrectNames([]);
        setLoading(false);
      }
    };
    loadData();
  }, [itemId, category, startDate]);

  useEffect(() => {
    if (!incorrectNames.length) return;

    const suggestionsObject = {
        [category]: incorrectNames,
    };

    onDataLoad({
        correctName: details.name,
        suggestions: suggestionsObject,
        selectedDescription: category,
        level
    });
  }, [incorrectNames, details.name, category, level, onDataLoad]);

  return (
    <ErrorBoundary>
      {loading ? <LoadingSkeleton /> : (
        <div className={`border border-white/30 p-4 
                      bg-zinc-950/70 rounded-md
                      backdrop-blur-sm
                      hover:border-white/30 hover:bg-zinc-950/70
                      transition-opacity duration-500
                      `}>
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg tracking-[0.2em] text-white/90 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300">
              Daily {category.charAt(0).toUpperCase() + category.slice(1)} Cypher #{details.id}
            </h2>
            <h3 className="text-xs sm:text-sm tracking-[0.2em] text-white/70 uppercase font-mono
                          hover:text-white/90
                          transition-all duration-300 mt-2">
              Release Year: {level < 4 ? details.releaseYear : '????'}
            </h3>
            <h3 className="text-xs sm:text-sm tracking-[0.2em] text-white/70 uppercase font-mono
                          hover:text-white/90
                          transition-all duration-300 mt-2">
              Genre: {level < 3 ? details.genre : '????'}
            </h3>
            <div className="text-sm sm:text-base leading-relaxed tracking-wide font-mono
                        backdrop-blur-sm text-white/90
                        hover:text-white
                        transition-colors duration-300">
              {Array.isArray(hashedDescription) ? applyOpacity(hashedDescription) : null}
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}

Description.propTypes = {
  onDataLoad: PropTypes.func.isRequired,
  level: PropTypes.number.isRequired,
  startDate: PropTypes.string.isRequired,
  category: PropTypes.oneOf(['game', 'movie', 'tv']).isRequired,
};

export default Description;