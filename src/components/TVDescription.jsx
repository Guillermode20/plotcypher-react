// fully working as of now, using a seed to generate the positions to hash works perfectly so don't touch it

import { useState, useEffect } from 'react';
import { initDB, getTVShow, populateDB, getAllTVShows } from '../database';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';

const symbols = ['#', '£', '$', '%', '&', '@'];

// Pseudorandom number generator function
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
  });  // Return array instead of joining
};

const applyOpacity = (textArray) => {
  return textArray.map((sentence, sentenceIndex) => (
    <div key={sentenceIndex} className="flex items-start space-x-2 mb-2">
      <span className="text-white/70">•</span>
      <span>
        {sentence.split('').map((char, index) => {
          if (symbols.includes(char)) {
            return <span key={index} className="text-white/40 font-mono">{char}</span>;
          }
          return <span key={index} className="font-mono">{char}</span>;
        })}
      </span>
    </div>
  ));
};

const getTVShowIdByDate = (startDate) => {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return (diffDays % 30) + 1; // Assuming there are 30 TV shows
};

function TVDescription(props) {
  const { onTVShowDataLoad, level, startDate } = props;
  const [TVShowDetails, setTVShowDetails] = useState({
    TVShowName: '',
    description: '',
    releaseYear: '', 
    genre: '',
    id: null, // Added id to initial state
  });
  const [incorrectTVShowNames, setIncorrectTVShowNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const seed = 12345;
  const hashedDescription = TVShowDetails.description 
    ? hash(TVShowDetails.description, level, seed) 
    : [];  // Initialize as empty array if no description
  const TVShowId = getTVShowIdByDate(startDate);

  useEffect(() => {
    const loadTVShowData = async () => {
      setIsLoading(true);
      try {
        await initDB();
        await populateDB();
        const TVShow = await getTVShow(TVShowId); // Gets TV show by ID based on date
        if (TVShow) {
          setTVShowDetails(TVShow);
        } else {
          console.error('TV Show not found');
        }
        const allTVShows = await getAllTVShows();
        // Fix: Use gameName instead of TVShowName
        const allTVShowNames = allTVShows.map(tv => tv.gameName);
        setIncorrectTVShowNames(allTVShowNames);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading TV show data:', error);
        setIsLoading(false);
      }
    };
    loadTVShowData();
  }, [TVShowId]);

  useEffect(() => {
    const TVShowData = {
      // Fix: Use gameName instead of TVShowName
      correctTVShow: TVShowDetails.gameName,
      incorrectTVShows: incorrectTVShowNames.filter(name => name !== TVShowDetails.gameName),
      level
    };
    onTVShowDataLoad(TVShowData);
  }, [level, onTVShowDataLoad, TVShowDetails.gameName, incorrectTVShowNames]);

  useEffect(() => {
    if (!isLoading) {
      setAnimate(true);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="border border-white/20 p-4 bg-zinc-950/50 rounded-md">
        <div className="space-y-4">
          <div className="h-7 bg-white/10 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-5 bg-white/10 w-1/3 rounded animate-pulse"></div>
            <div className="h-5 bg-white/10 w-1/4 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`border border-white/20 p-4 
                      bg-zinc-950/50 rounded-md
                      backdrop-blur-sm
                      hover:border-white/30 hover:bg-zinc-950/70
                      transition-opacity duration-500
                      ${animate ? 'opacity-100' : 'opacity-0'}`}>
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg tracking-[0.2em] text-white/80 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300">
            Daily TV Show Cypher #{TVShowDetails.id}
          </h2>
          <h3 className="text-xs sm:text-sm tracking-[0.2em] text-white/60 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300 mt-2">
            Release Year: {level < 4 ? TVShowDetails.releaseYear : '????'}
          </h3>
          <h3 className="text-xs sm:text-sm tracking-[0.2em] text-white/60 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300 mt-2">
            Genre: {level < 3 ? TVShowDetails.genre : '????'}
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

TVDescription.propTypes = {
  onTVShowDataLoad: PropTypes.func.isRequired,
  level: PropTypes.number.isRequired,
  startDate: PropTypes.string.isRequired, // Add prop type
};

export default TVDescription;