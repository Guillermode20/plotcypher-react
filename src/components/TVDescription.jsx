// fully working as of now, using a seed to generate the positions to hash works perfectly so don't touch it

import { useState, useEffect } from 'react';
import { initDB, getTVShow, populateDB, getAllTVShows } from '../database';
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

const Description = ({ onTVShowDataLoad, level }) => {
  const [TVShowDetails, setTVShowDetails] = useState({
    TVShowName: '',
    description: '',
    releaseYear: '', 
    genre: '',
    id: null, // Added id to initial state
  });
  const [incorrectTVShowNames, setIncorrectTVShowNames] = useState([]);
  const seed = 12345;
  const hashedDescription = TVShowDetails.description ? hash(TVShowDetails.description, level, seed) : '';

  useEffect(() => {
    const loadTVShowData = async () => {
      try {
        await initDB();
        await populateDB();
        const TVShow = await getTVShow(1); // Gets TVShow by ID
        if (TVShow) {
          setTVShowDetails(TVShow);
        } else {
          console.error('TVShow not found');
          // Optionally set default TVShow details
          // setTVShowDetails({ TVShowName: 'Unknown', description: '', releaseYear: '', genre: '', id: null });
        }
        // Fetch all TV show names
        const allTVShows = await getAllTVShows();
        const allTVShowNames = allTVShows.map(show => show.TVShowName);
        setIncorrectTVShowNames(allTVShowNames);
      } catch (error) {
        console.error('Error loading TVShow data:', error);
      }
    };

    loadTVShowData();
  }, []);

  useEffect(() => {
    const TVShowData = {
      correctTVShow: TVShowDetails.TVShowName,
      incorrectTVShows: incorrectTVShowNames,
      level
    };
    onTVShowDataLoad(TVShowData);
  }, [level, onTVShowDataLoad, TVShowDetails.TVShowName, incorrectTVShowNames]);

  return (
    <div className="border border-white/20 p-8 
                    bg-zinc-950/50 rounded-md
                    backdrop-blur-sm
                    hover:border-white/30 hover:bg-zinc-950/70">
      <div className="space-y-4">
        <h2 className="text-lg tracking-[0.2em] text-white/80 uppercase font-mono
                      hover:text-white/90
                      transition-all duration-300">
          Daily TV Show Cypher #{TVShowDetails.id}
        </h2>
        <h3 className="text tracking-[0.2em] text-white/60 uppercase font-mono
                      hover:text-white/90
                      transition-all duration-300 mt-2">
          Release Year: {level < 4 ? TVShowDetails.releaseYear : '????'}
        </h3>
        <h3 className="text tracking-[0.2em] text-white/60 uppercase font-mono
                      hover:text-white/90
                      transition-all duration-300 mt-2">
          Genre: {level < 3 ? TVShowDetails.genre : '????'}
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
  onTVShowDataLoad: PropTypes.func.isRequired,
  level: PropTypes.number.isRequired
};

export default Description;