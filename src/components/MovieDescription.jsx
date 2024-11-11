// fully working as of now, using a seed to generate the positions to hash works perfectly so don't touch it

import { useState, useEffect } from 'react';
import { initDB, getMovie, populateDB, getAllMovies } from '../database'; // Added getAllMovies
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
            return <span key={index} className="text-white/70 font-mono">{char}</span>;
          }
          return <span key={index} className="font-mono">{char}</span>;
        })}
      </span>
    </div>
  ));
};

const getMovieIdByDate = (startDate) => {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return (diffDays % 30) + 1; // Assuming there are 30 movies
};

const Description = ({ onMovieDataLoad, level, startDate }) => {
  const [movieDetails, setMovieDetails] = useState({
    movieName: '',
    description: '',
    releaseYear: '', 
    genre: '',
    id: null, // Added id to initial state
  });
  const [incorrectMovieNames, setIncorrectMovieNames] = useState([]); // Added state for incorrect movie names
  const seed = 12345;
  const hashedDescription = movieDetails.description 
    ? hash(movieDetails.description, level, seed) 
    : [];  // Initialize as empty array if no description
  const movieId = getMovieIdByDate(startDate);

  useEffect(() => {
    const loadMovieData = async () => {
      try {
        await initDB();
        await populateDB();
        const movie = await getMovie(movieId);
        if (movie) {
          setMovieDetails(movie);
        } else {
          console.error('Movie not found');
        }
        const allMovies = await getAllMovies();
        // Fix: Use gameName instead of movieName
        const allMovieNames = allMovies.map(m => m.gameName);
        setIncorrectMovieNames(allMovieNames);
      } catch (error) {
        console.error('Error loading movie data:', error);
      }
    };

    loadMovieData();
  }, [movieId]);

  useEffect(() => {
    const movieData = {
      // Fix: Use gameName instead of movieName
      correctMovie: movieDetails.gameName,
      incorrectMovies: incorrectMovieNames.filter(name => name !== movieDetails.gameName),
      level
    };
    onMovieDataLoad(movieData);
  }, [level, onMovieDataLoad, movieDetails.gameName, incorrectMovieNames]);

  return (
    <ErrorBoundary>
      <div className="border border-white/30 p-4 
                      bg-zinc-950/70 rounded-md
                      backdrop-blur-sm
                      hover:border-white/30 hover:bg-zinc-950/70">
        <div className="space-y-2">
          <h2 className="text-base sm:text-lg tracking-[0.2em] text-white/90 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300">
            Daily Movie Cypher #{movieDetails.id}
          </h2>
          <h3 className="text-xs sm:text-sm tracking-[0.2em] text-white/70 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300 mt-2">
            Release Year: {level < 4 ? movieDetails.releaseYear : '????'}
          </h3>
          <h3 className="text-xs sm:text-sm tracking-[0.2em] text-white/70 uppercase font-mono
                        hover:text-white/90
                        transition-all duration-300 mt-2">
            Genre: {level < 3 ? movieDetails.genre : '????'}
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
};

Description.propTypes = {
  onMovieDataLoad: PropTypes.func.isRequired,
  level: PropTypes.number.isRequired,
  startDate: PropTypes.string.isRequired, // Add prop type
};

export default Description;