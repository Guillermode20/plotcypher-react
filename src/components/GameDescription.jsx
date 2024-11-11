// fully working as of now, using a seed to generate the positions to hash works perfectly so don't touch it

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';
import { initDB, getGame, populateDB, getAllGames } from '../database';

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
  // Split text into sentences
  const sentences = text.split('.')
    .filter(s => s.trim())
    .map(s => s.trim() + '.');
  
  // Initialize PRNG with seed
  const prng = pseudoRandom(seed);
  
  // Calculate how many sentences should be visible based on level
  const visibleSentences = 5 - level;
  
  // Process each sentence
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
            return <span key={index} className="text-white/70 font-mono">{char}</span>;
          }
          return <span key={index} className="font-mono">{char}</span>;
        })}
      </span>
    </div>
  ));
};

const getGameIdByDate = (startDate) => {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return (diffDays % 30) + 1; // Assuming there are 30 games
};

const Description = ({ onGameDataLoad, level, startDate }) => {
  const [gameDetails, setGameDetails] = useState({
    gameName: '',
    description: '',
    releaseYear: '', 
    genre: '',
    id: null // Added id to match other components
  });
  const [incorrectGameNames, setIncorrectGameNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const seed = 12345;
  const hashedDescription = gameDetails.description 
    ? hash(gameDetails.description, level, seed) 
    : [];  // Initialize as empty array if no description
  const gameId = getGameIdByDate(startDate);

  useEffect(() => {
    const loadGameData = async () => {
      setIsLoading(true);
      try {
        await initDB();
        await populateDB();
        const game = await getGame(gameId); // Gets game by ID based on date
        if (game) {
          setGameDetails(game);
        } else {
          console.error('Game not found');
        }
        
        // Fetch all game names with error handling for both array and object responses
        const allGames = await getAllGames();
        if (allGames) {
          // Convert to array if single object
          const gamesArray = Array.isArray(allGames) ? allGames : [allGames];
          const allGameNames = gamesArray.map(g => g.gameName).filter(Boolean);
          setIncorrectGameNames(allGameNames);
        } else {
          console.error('No games data received');
          setIncorrectGameNames([]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading game data:', error);
        setIsLoading(false);
      }
    };

    loadGameData();
  }, [gameId]);

  useEffect(() => {
    if (!isLoading) {
      setAnimate(true);
    }
  }, [isLoading]);

  useEffect(() => {
    const gameData = {
      correctGame: gameDetails.gameName,
      incorrectGames: incorrectGameNames,
      level
    };
    onGameDataLoad(gameData);
  }, [level, onGameDataLoad, gameDetails.gameName, incorrectGameNames]);

  if (isLoading) {
    return (
      <div className="border border-white/30 p-4 bg-zinc-950/70 rounded-md">
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
      <div className={`border border-white/30 p-4 
                      bg-zinc-950/70 rounded-md
                      backdrop-blur-sm
                      hover:border-white/30 hover:bg-zinc-950/70
                      transition-opacity duration-500
                      ${animate ? 'opacity-100' : 'opacity-0'}`}>
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg tracking-[0.2em] text-white/90 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300">
            Daily Game Cypher #{gameDetails.id}
          </h2>
          <h3 className="text-xs sm:text-sm tracking-[0.2em] text-white/70 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300 mt-2">
            Release Year: {level < 4 ? gameDetails.releaseYear : '????'}
          </h3>
          <h3 className="text-xs sm:text-sm tracking-[0.2em] text-white/70 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300 mt-2">
            Genre: {level < 3 ? gameDetails.genre : '????'}
          </h3>
          <div className="text-sm sm:text-base leading-relaxed tracking-wide font-mono
                      backdrop-blur-sm text-white/90
                      hover:text-white
                      transition-colors duration-300">
            {Array.isArray(hashedDescription) ? applyOpacity(hashedDescription) : null}
          </div>
          <p className='text-lg text-green-500'>Trying out a new format.</p>
        </div>
      </div>
    </ErrorBoundary>
  );
};

Description.propTypes = {
  onGameDataLoad: PropTypes.func.isRequired,
  level: PropTypes.number.isRequired,
  startDate: PropTypes.string.isRequired, // Add prop type
};

export default Description;