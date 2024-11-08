// fully working as of now, using a seed to generate the positions to hash works perfectly so don't touch it

import { useState, useEffect } from 'react';
import { initDB, getMovie, populateDB, getAllMovies } from '../database'; // Added getAllMovies
import PropTypes from 'prop-types';

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
  const sentences = text.split('.').filter(s => s.trim()).map(s => s.trim() + '.');
  
  // Initialize PRNG with seed
  const prng = pseudoRandom(seed);
  
  // Calculate how many sentences should be visible based on level
  const visibleSentences = 5 - level; // More sentences visible at lower levels
  
  // Process each sentence
  const processedText = sentences.map((sentence, index) => {
    if (index < visibleSentences) {
      // Keep sentence visible
      return sentence;
    } else {
      // Hash the sentence
      return sentence.split('').map(char => {
        if ([' ', '.', ',', ';', ':', '"', "'", '-', '(', ')', '[', ']', '?', '!'].includes(char)) {
          return char;
        }
        // Use PRNG to select a symbol
        const hashedIndex = Math.floor(prng() * symbols.length);
        return symbols[hashedIndex];
      }).join('');
    }
  }).join(' ');

  return processedText;
};

const applyOpacity = (text) => {
  return text.split('').map((char, index) => {
    if (symbols.includes(char)) {
      return <span key={index} className="text-white/40 font-mono">{char}</span>;
    }
    return <span key={index} className="font-mono">{char}</span>;
  });
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
  const hashedDescription = movieDetails.description ? hash(movieDetails.description, level, seed) : '';
  const movieId = getMovieIdByDate(startDate);

  useEffect(() => {
    const loadMovieData = async () => {
      try {
        await initDB();
        await populateDB();
        const movie = await getMovie(movieId); // Gets movie by ID based on date
        if (movie) {
          setMovieDetails(movie);
        } else {
          console.error('Movie not found');
        }
        // Fetch all movie names
        const allMovies = await getAllMovies();
        const allMovieNames = allMovies.map(m => m.movieName);
        setIncorrectMovieNames(allMovieNames);
      } catch (error) {
        console.error('Error loading movie data:', error);
      }
    };

    loadMovieData();
  }, [movieId]);

  useEffect(() => {
    const movieData = {
      correctMovie: movieDetails.movieName,
      incorrectMovies: incorrectMovieNames,
      level
    };
    onMovieDataLoad(movieData);
  }, [level, onMovieDataLoad, movieDetails.movieName, incorrectMovieNames]); // Added incorrectMovieNames to dependencies

  return (
    <div className="border border-white/20 p-4 
                    bg-zinc-950/50 rounded-md
                    backdrop-blur-sm
                    hover:border-white/30 hover:bg-zinc-950/70">
      <div className="space-y-2">
        <h2 className="text-lg tracking-[0.2em] text-white/80 uppercase font-mono
                      hover:text-white/90
                      transition-all duration-300">
          Daily Movie Cypher #{movieDetails.id}
        </h2>
        <h3 className="text tracking-[0.2em] text-white/60 uppercase font-mono
                      hover:text-white/90
                      transition-all duration-300 mt-2">
          Release Year: {level < 4 ? movieDetails.releaseYear : '????'}
        </h3>
        <h3 className="text tracking-[0.2em] text-white/60 uppercase font-mono
                      hover:text-white/90
                      transition-all duration-300 mt-2">
          Genre: {level < 3 ? movieDetails.genre : '????'}
        </h3>
        <p className="text leading-relaxed tracking-wide font-mono
                     backdrop-blur-sm text-white/90
                     hover:text-white
                     transition-colors duration-300">
          {applyOpacity(hashedDescription)}
        </p>
      </div>
    </div>
  );
};

Description.propTypes = {
  onMovieDataLoad: PropTypes.func.isRequired,
  level: PropTypes.number.isRequired,
  startDate: PropTypes.string.isRequired, // Add prop type
};

export default Description;