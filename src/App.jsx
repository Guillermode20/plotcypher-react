import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';

const GameDescription = lazy(() => import('./components/GameDescription.jsx'));
const MovieDescription = lazy(() => import('./components/MovieDescription.jsx'));
const TVDescription = lazy(() => import('./components/TVDescription.jsx'));

const TESTING_MODE = true; // Set to true to disable persistence and daily resets

function App() {
  const startDate = '2024-11-08'; // Your game's launch date

  const [selectedDescription, setSelectedDescription] = useState('game');
  const [gameData, setGameData] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [levels, setLevels] = useState(() => {
    if (TESTING_MODE) {
      return {
        game: 4,
        movie: 4,
        tv: 4
      };
    }
    
    const saved = localStorage.getItem('levels');
    const lastDate = localStorage.getItem('lastPlayedDate');
    const today = new Date().toDateString();
    
    // Reset if it's a new day
    if (lastDate !== today) {
      return {
        game: 4,
        movie: 4,
        tv: 4
      };
    }
    return saved ? JSON.parse(saved) : {
      game: 4,
      movie: 4,
      tv: 4
    };
  });
  const dropdownRef = useRef(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [gameOverStates, setGameOverStates] = useState(() => {
    if (TESTING_MODE) {
      return {
        game: false,
        movie: false,
        tv: false
      };
    }
    
    const saved = localStorage.getItem('gameOverStates');
    const lastDate = localStorage.getItem('lastPlayedDate');
    const today = new Date().toDateString();
    
    // Reset if it's a new day
    if (lastDate !== today) {
      return {
        game: false,
        movie: false,
        tv: false
      };
    }
    return saved ? JSON.parse(saved) : {
      game: false,
      movie: false,
      tv: false
    };
  });
  const [attempts, setAttempts] = useState(() => {
    if (TESTING_MODE) {
      return {
        game: 0,
        movie: 0,
        tv: 0
      };
    }
    
    const saved = localStorage.getItem('attempts');
    const lastDate = localStorage.getItem('lastPlayedDate');
    const today = new Date().toDateString();
    
    // Reset if it's a new day
    if (lastDate !== today) {
      return {
        game: 0,
        movie: 0,
        tv: 0
      };
    }
    return saved ? JSON.parse(saved) : {
      game: 0,
      movie: 0,
      tv: 0
    };
  });

  // Add new state near other state declarations
  const [dropdownDirection, setDropdownDirection] = useState('down');
  const inputRef = useRef(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const handleGameData = useCallback((data) => {
    setGameData(data);
  }, []); // Empty dependency array since we don't need any dependencies

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Preload lazy-loaded components
  useEffect(() => {
    import('./components/GameDescription.jsx');
    import('./components/MovieDescription.jsx');
    import('./components/TVDescription.jsx');
  }, []);

  const calculateLetterMatch = (str1, str2) => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    let matches = 0;
    const minLength = Math.min(s1.length, s2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    return (matches / s1.length) * 100;
  };

  // Add this function before the return statement
  const updateDropdownDirection = useCallback(() => {
    if (!inputRef.current) return;
    
    const inputRect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceNeeded = 240; // approximate max height of dropdown (60px * 4 items)
    
    setDropdownDirection(spaceBelow < spaceNeeded ? 'up' : 'down');
  }, []);

  // Add this effect after other useEffects
  useEffect(() => {
    if (showDropdown) {
      updateDropdownDirection();
      window.addEventListener('resize', updateDropdownDirection);
      return () => window.removeEventListener('resize', updateDropdownDirection);
    }
  }, [showDropdown, updateDropdownDirection]);

  // Add effect to persist state changes
  useEffect(() => {
    if (!TESTING_MODE) {
      localStorage.setItem('gameOverStates', JSON.stringify(gameOverStates));
      localStorage.setItem('levels', JSON.stringify(levels));
      localStorage.setItem('attempts', JSON.stringify(attempts));
      localStorage.setItem('lastPlayedDate', new Date().toDateString());
    }
  }, [gameOverStates, levels, attempts]);
  
  return (
    <div className="relative min-h-screen bg-zinc-950 bg-gradient-to-b from-zinc-950 to-zinc-900 text-white font-mono scrollbar-gutter-stable">
      <div className="container relative mx-auto px-2 sm:px-4 py-2 sm:py-8">
        <div className="max-w-2xl mx-auto p-2 sm:p-4 
                      backdrop-blur-sm bg-zinc-950/80 border border-white/20 
                      rounded-lg shadow-xl drop-shadow-glow hover:shadow-2xl
                      transition-all duration-300
                      box-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          <header className="p-4 relative border border-white/20 bg-zinc-950/50 rounded-md
                         hover:border-white/30 transition-all duration-300 mb-4">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-white/90
                        hover:text-white transition-colors duration-300">
              PLOTCYPHER
            </h1>
            <p className="mt-2 text text-white/60 tracking-[0.25em] /* Changed mt-3 to mt-2 */
                       hover:text-white/80 transition-colors duration-300">
              DAILY QUIZZES TO TEST YOUR MEDIA KNOWLEDGE
            </p>
          </header>
          
          {/* Button group with adjusted spacing */}
          <div className="flex w-full rounded-md shadow-sm mb-4" role="group">
            <button
              onClick={() => setSelectedDescription('game')}
              className={`flex-1 px-6 py-2 tracking-[0.2em] border border-white/20 rounded-l-md bg-zinc-950/50 hover:bg-zinc-950/70 hover:border-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 ${
                selectedDescription === 'game' ? 'text-white/90 bg-zinc-950/70 border-white/30' : 'text-white/50'
              }`}
            >
              Game
            </button>
            <button
              onClick={() => setSelectedDescription('movie')} 
              className={`flex-1 px-6 py-2 tracking-[0.2em] border border-white/20 bg-zinc-950/50 hover:bg-zinc-950/70 hover:border-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 ${
                selectedDescription === 'movie' ? 'text-white/90 bg-zinc-950/70 border-white/30' : 'text-white/50'
              }`}
            >
              Movie
            </button>
            <button
              onClick={() => setSelectedDescription('tv')}
              className={`flex-1 px-6 py-2 tracking-[0.2em] border border-white/20 rounded-r-md bg-zinc-950/50 hover:bg-zinc-950/70 hover:border-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300 ${
                selectedDescription === 'tv' ? 'text-white/90 bg-zinc-950/70 border-white/30' : 'text-white/50'
              }`}
            >
              TV
            </button>
          </div>

          {!gameOverStates[selectedDescription] ? (
            <div className="space-y-4 relative">
              <Suspense fallback={<div>Loading...</div>}>
                {selectedDescription === 'game' && (
                  <div>
                    <GameDescription  
                      onGameDataLoad={handleGameData}
                      level={levels.game}
                      startDate={startDate} // Pass startDate as prop
                    />
                  </div>
                )}
                {selectedDescription === 'movie' && (
                  <div>
                    <MovieDescription 
                      onMovieDataLoad={handleGameData} // Adjust props as needed
                      level={levels.movie}
                      startDate={startDate} // Pass startDate as prop
                    />
                  </div>
                )}
                {selectedDescription === 'tv' && (
                  <div>
                    <TVDescription 
                      onTVShowDataLoad={handleGameData}
                      level={levels.tv}
                      startDate={startDate} // Pass startDate as prop
                    />
                  </div>
                )}
              </Suspense>

              <p className={`inline-block px-4 py-2 
                        text text-white/60 tracking-[0.2em]
                        border border-white/20 rounded-md
                        bg-zinc-950/50 hover:bg-zinc-950/70
                        hover:border-white/30
                        transition-all duration-300
                        ${isFlashing ? 'animate-flash' : ''}`}>
                DECRYPTION ATTEMPTS REMAINING: <span className="text-white/90">{ levels[selectedDescription] + 1 }</span>
              </p>
              <div className="relative flex flex-col sm:flex-row gap-2" ref={dropdownRef}>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowDropdown(true);
                  }}
                  className="w-full px-4 py-2
                    text text-white/90 tracking-[0.2em] placeholder:text-white/50
                    border border-white/20 rounded-md
                    bg-zinc-950/50
                    hover:bg-zinc-950/70 hover:border-white/30
                    focus:outline-none focus:border-white/40 
                    focus:ring-2 focus:ring-white/20
                    transition-all duration-300"
                  placeholder="ENTER YOUR GUESS..."
                />
                <button
                  onClick={() => {
                    if (gameData) {
                      let isCorrect = false;
                      const userInput = searchInput.toLowerCase();
                  
                      if (
                        selectedDescription === 'game' &&
                        userInput === gameData.correctGame.toLowerCase()
                      ) {
                        isCorrect = true;
                      } else if (
                        selectedDescription === 'movie' &&
                        userInput === gameData.correctMovie.toLowerCase()
                      ) {
                        isCorrect = true;
                      } else if (
                        selectedDescription === 'tv' &&
                        userInput === gameData.correctTVShow.toLowerCase()
                      ) {
                        isCorrect = true;
                      }
                  
                      if (isCorrect) {
                        setShowWinModal(true);
                        setGameOverStates((prevStates) => ({
                          ...prevStates,
                          [selectedDescription]: true,
                        }));
                        return;
                      }

                      // Decrease level but not below 0, then check for failure
                      setLevels((prevLevels) => {
                        const updatedLevel = Math.max(-1, prevLevels[selectedDescription] - 1);
                        
                        if (updatedLevel <= -1) {
                          setShowFailModal(true);
                          setGameOverStates((prevStates) => ({
                            ...prevStates,
                            [selectedDescription]: true,
                          }));
                        }
                        
                        return {
                          ...prevLevels,
                          [selectedDescription]: updatedLevel,
                        };
                      });

                      setAttempts((prevAttempts) => ({
                        ...prevAttempts,
                        [selectedDescription]: prevAttempts[selectedDescription] + 1,
                      }));

                      setShowDropdown(false);
                      setIsFlashing(true);
                      setTimeout(() => setIsFlashing(false), 1000);
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-2
                    text-white/90 tracking-[0.2em]
                    border border-white/20 rounded-md
                    bg-zinc-950/50
                    hover:bg-zinc-950/70 hover:border-white/30
                    focus:outline-none focus:border-white/40
                    focus:ring-2 focus:ring-white/20
                    transition-all duration-300"
                >
                  DECRYPT
                </button>
                {showDropdown && searchInput && gameData && levels[selectedDescription] <= 4 && (
                  <ul className={`absolute left-0 right-0 ${
                    dropdownDirection === 'up' 
                      ? 'bottom-[calc(100%+0.5rem)]' 
                      : 'top-[calc(100%+0.5rem)]'
                  }
                    border border-white/20 rounded-md
                    bg-zinc-950/90 backdrop-blur-sm
                    shadow-lg max-h-60 overflow-y-auto z-50
                    divide-y divide-white/10
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-white/20
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:border-2
                    [&::-webkit-scrollbar-thumb]:border-transparent
                    [&::-webkit-scrollbar-thumb]:bg-clip-padding
                    [&::-webkit-scrollbar-thumb]:hover:bg-white/30`}>
                    {(selectedDescription === 'game'
                      ? gameData.incorrectGames || []
                      : selectedDescription === 'movie'
                      ? gameData.incorrectMovies || []
                      : gameData.incorrectTVShows || []
                    ).filter(item => {
                      const matchPercentage = calculateLetterMatch(searchInput, item);
                      return matchPercentage >= 20 && item.toLowerCase().includes(searchInput.toLowerCase());
                    }).map((item, index) => (
                      <li
                        key={index}
                        className="px-4 py-2 cursor-pointer
                                   text-white/70 hover:text-white
                                   hover:bg-zinc-800/50
                                   transition-all duration-200
                                   block w-full text-left"
                        onClick={() => {
                          setSearchInput(item);
                          setShowDropdown(false);
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 relative">
              <p className="text-center text-white/90 text-xl">
                {gameOverStates[selectedDescription] && levels[selectedDescription] >= 0
                  ? `You succeeded in ${attempts[selectedDescription]+1} attempt(s)!`
                  : 'You failed to decrypt the cypher.'}
              </p>
              <p className="text-center text-white/90 text-xl">
                New {selectedDescription} cypher available tomorrow :)
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm pointer-events-none"></div>
          <div className="relative bg-zinc-900 border border-white/20 rounded-lg p-8 max-w-md w-full m-4 shadow-xl">
            <h2 className="text-2xl font-bold text-white/90 mb-4 tracking-wider">Success!</h2>
            <p className="text-white/80 mb-6">
              Congratulations! You successfully decrypted the{' '}
              {selectedDescription === 'game' && 'game'}
              {selectedDescription === 'movie' && 'movie'}
              {selectedDescription === 'tv' && 'TV show'}:
              <span className="block mt-2 text-xl text-white font-bold mb-1">
                {selectedDescription === 'game' && gameData?.correctGame}
                {selectedDescription === 'movie' && gameData?.correctMovie}
                {selectedDescription === 'tv' && gameData?.correctTVShow}
              </span>
            </p>
            <button
              onClick={() => setShowWinModal(false)}
              className="px-4 py-2 bg-white text-zinc-900 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Fail Modal */}
      {showFailModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm pointer-events-none"></div>
          <div className="relative bg-zinc-900 border border-red-500 rounded-lg p-8 max-w-md w-full m-4 shadow-xl">
            <h2 className="text-2xl font-bold text-red-500 mb-4">DECRYPTION FAILED!</h2>
            <p className="text-white/80 mb-6">
              You&apos;ve used all your decryption attempts. Better luck tomorrow!
            </p>
            <button
              onClick={() => setShowFailModal(false)}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
