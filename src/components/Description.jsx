import { useState, useEffect } from 'react';
import { initDB, populateDB, getItemById, getAllGames, getAllMovies, getAllTVShows } from '../database';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';

const symbols = ['#', '£', '$', '%', '&', '@'];

function pseudoRandom(seed) {
  let value = seed;
  return function() {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

const hash = (text, level, seed) => {
  const sentences = text.split('.')
    .filter(s => s.trim())
    .map(s => s.trim() + '.');
  
  const prng = pseudoRandom(seed);
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
  const [details, setDetails] = useState({
    name: '',
    description: '',
    releaseYear: '', 
    genre: '',
    id: null, 
  });
  const [incorrectNames, setIncorrectNames] = useState([]);
  const seed = 12345;
  const hashedDescription = details.description 
    ? hash(details.description, level, seed) 
    : [];  
  const itemId = getItemIdByDate(startDate);

  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        await populateDB();
        const item = await getItemById(category, itemId);
        
        if (!item) {
            console.error(`No item found for ${category} with ID ${itemId}`);
            return;
        }

        setDetails({
            name: item.Name,
            description: item.Description,
            releaseYear: item.ReleaseYear,
            genre: item.Genres,
            id: item.ID,
        });

        // Fetch all items based on category
        let allItems = [];
        switch(category) {
            case 'game':
                allItems = await getAllGames();
                break;
            case 'movie':
                allItems = await getAllMovies();
                break;
            case 'tv':
                allItems = await getAllTVShows();
                break;
        }

        console.log(`Loaded ${allItems.length} items for ${category}`);

        // Create array of all names, including the correct one
        const names = allItems
            .map(i => i.Name)
            .filter(name => name && typeof name === 'string');

        setIncorrectNames(names);

    } catch (error) {
        console.error(`Error loading ${category} data:`, error);
    }
};
loadData();
}, [itemId, category]);

useEffect(() => {
    // Ensure we have names to work with
    if (!incorrectNames.length) {
        console.warn('No names available for suggestions');
        return;
    }

    // Create suggestions object with the correct structure
    const suggestionsObject = {
        game: category === 'game' ? incorrectNames : [],
        movie: category === 'movie' ? incorrectNames : [],
        tv: category === 'tv' ? incorrectNames : []
    };

    const data = {
        correctName: details.name,
        suggestions: suggestionsObject,
        selectedDescription: category,
        level
    };

    console.log('Sending suggestions to parent:', suggestionsObject);
    onDataLoad(data);
}, [incorrectNames, details.name, category, level, onDataLoad]);

  return (
    <ErrorBoundary>
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