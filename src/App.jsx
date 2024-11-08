import { useState, useEffect, useRef, useCallback, Suspense, lazy, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import InfoPopUp from './components/InfoPopUp.jsx';
import ProjectInfoPopUp from './components/ProjectInfoPopUp.jsx';

const GameDescription = lazy(() => import('./components/GameDescription.jsx'));
const MovieDescription = lazy(() => import('./components/MovieDescription.jsx'));
const TVDescription = lazy(() => import('./components/TVDescription.jsx'));

const TESTING_MODE = false; // Set to true to disable persistence and daily resets

const LoadingScreen = memo(() => (
  <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-5xl text-white/90">PLOTCYPHER</h2>
      <p className="text-white/60">LOADING...</p>
    </div>
  </div>
));
LoadingScreen.displayName = 'LoadingScreen';

const CategoryButtons = memo(({ selectedDescription, onSelect }) => (
  <div className="flex w-full rounded-md shadow-sm mb-4" role="group">
    {['game', 'movie', 'tv'].map((category) => (
      <button
        key={category}
        onClick={() => onSelect(category)}
        className={`flex-1 px-6 py-2 tracking-[0.2em] border border-white/20 
          ${category === 'game' ? 'rounded-l-md' : category === 'tv' ? 'rounded-r-md' : ''} 
          bg-zinc-950/50 hover:bg-zinc-950/70 hover:border-white/30 
          focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 
          transition-all duration-300 
          ${selectedDescription === category ? 'text-white/90 bg-zinc-950/70 border-white/30' : 'text-white/50'}`}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </button>
    ))}
  </div>
));

CategoryButtons.propTypes = {
  selectedDescription: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

CategoryButtons.displayName = 'CategoryButtons';

function App() {
  const startDate = '2024-11-08'; // Your game's launch date
  const [isLoading, setIsLoading] = useState(true);

  // Add loading effect
  useEffect(() => {
    // Simulate minimum loading time of 1 second
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const [selectedDescription, setSelectedDescription] = useState(null);
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

  // Add this state with other state declarations
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

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

  // Memoize calculateLetterMatch
  const calculateLetterMatch = useMemo(() => (str1, str2) => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    let matches = 0;
    const minLength = Math.min(s1.length, s2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    return (matches / s1.length) * 100;
  }, []);

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

  // Update this effect
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (TESTING_MODE || (!hasVisited && !TESTING_MODE)) {
      setShowInfoModal(true);
      if (!TESTING_MODE) {
        localStorage.setItem('hasVisitedBefore', 'true');
      }
    }
  }, []);

  // Update filteredSuggestions to require minimum 3 characters
  const filteredSuggestions = useMemo(() => {
    if (!gameData || !searchInput || searchInput.length < 3) return [];
    
    const suggestions = selectedDescription === 'game'
      ? gameData.incorrectGames
      : selectedDescription === 'movie'
      ? gameData.incorrectMovies
      : gameData.incorrectTVShows;

    const searchQuery = searchInput.toLowerCase();
    
    return suggestions?.filter(item => {
      const itemLower = item.toLowerCase();
      if (!itemLower.includes(searchQuery)) return false;
      
      const matchIndex = itemLower.indexOf(searchQuery);
      const matchSegment = itemLower.slice(matchIndex, matchIndex + searchQuery.length);
      const matchPercentage = calculateLetterMatch(searchQuery, matchSegment);
      
      return matchPercentage >= 10;
    }).sort((a, b) => {
      const aStartsWith = a.toLowerCase().startsWith(searchQuery);
      const bStartsWith = b.toLowerCase().startsWith(searchQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      return 0;
    }) || [];
  }, [gameData, searchInput, selectedDescription, calculateLetterMatch]);

  // Batch state updates
  const handleGuessSubmit = useCallback(() => {
    if (!gameData) return;

    const userInput = searchInput.toLowerCase();
    let isCorrect = false;

    if (selectedDescription === 'game' && userInput === gameData.correctGame.toLowerCase()) {
      isCorrect = true;
    } else if (selectedDescription === 'movie' && userInput === gameData.correctMovie.toLowerCase()) {
      isCorrect = true;
    } else if (selectedDescription === 'tv' && userInput === gameData.correctTVShow.toLowerCase()) {
      isCorrect = true;
    }

    if (isCorrect) {
      setGameOverStates(prev => ({
        ...prev,
        [selectedDescription]: true
      }));
      setShowWinModal(true);
      return;
    }

    // Batch updates together
    const updatedLevel = Math.max(-1, levels[selectedDescription] - 1);
    const updates = {
      levels: {
        ...levels,
        [selectedDescription]: updatedLevel
      },
      attempts: {
        ...attempts,
        [selectedDescription]: attempts[selectedDescription] + 1
      },
      gameOverStates: updatedLevel <= -1 ? {
        ...gameOverStates,
        [selectedDescription]: true
      } : gameOverStates
    };

    setLevels(updates.levels);
    setAttempts(updates.attempts);
    setGameOverStates(updates.gameOverStates);
    setShowDropdown(false);
    
    if (updatedLevel <= -1) {
      setShowFailModal(true);
    }

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 1000);
  }, [gameData, searchInput, selectedDescription, levels, attempts, gameOverStates]);
  
  // Memoize handlers
  const handleCategorySelect = useCallback((category) => {
    setSelectedDescription(category);
  }, []);

  // Memoize dropdown items renderer
  const renderDropdownItems = useMemo(() => (
    filteredSuggestions.map((item, index) => (
      <li
        key={index}
        className="px-4 py-2 cursor-pointer text-white/70 hover:text-white hover:bg-zinc-800/50 transition-all duration-200 block w-full text-left"
        onClick={() => {
          setSearchInput(item);
          setShowDropdown(false);
        }}
      >
        {item}
      </li>
    ))
  ), [filteredSuggestions]);

  // Memoize modal components
  const WinModal = useMemo(() => {
    if (!showWinModal) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm pointer-events-none"></div>
        <div className="relative bg-zinc-950 border border-white/20 rounded-lg p-8 max-w-md w-full m-4 shadow-xl">
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
            className="w-full sm:w-auto px-6 py-2
                        text-white/90 tracking-[0.2em]
                        border border-white/20 rounded-md
                        bg-zinc-950/50
                        hover:bg-zinc-950/70 hover:border-white/30
                        focus:outline-none focus:border-white/40
                        focus:ring-2 focus:ring-white/20
                        transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }, [showWinModal, selectedDescription, gameData]);

  const FailModal = useMemo(() => {
    if (!showFailModal) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm pointer-events-none"></div>
        <div className="relative bg-zinc-950 border border-red-500 rounded-lg p-8 max-w-md w-full m-4 shadow-xl">
          <h2 className="text-2xl font-bold text-red-500 mb-4">DECRYPTION FAILED!</h2>
          <p className="text-white/80 mb-3">
            The correct answer was:
            <span className="block mt-2 text-xl text-white font-bold mb-1">
              {selectedDescription === 'game' && gameData?.correctGame}
              {selectedDescription === 'movie' && gameData?.correctMovie}
              {selectedDescription === 'tv' && gameData?.correctTVShow}
            </span>
          </p>
          <p className="text-white/80 mb-6">
            You&apos;ve used all your decryption attempts. Better luck tomorrow!
          </p>
          <button
            onClick={() => setShowFailModal(false)}
            className="w-full sm:w-auto px-6 py-2
                        text-white/90 tracking-[0.2em]
                        border border-red/20 rounded-md
                        bg-zinc-950/50
                        hover:bg-zinc-950/70 hover:border-white/30
                        focus:outline-none focus:border-white/40
                        focus:ring-2 focus:ring-white/20
                        transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }, [showFailModal, selectedDescription, gameData]);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

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
            <div className="flex items-center justify-between">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-white/90
                          hover:text-white transition-colors duration-300">
                PLOTCYPHER
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-2 text-white/60 hover:text-white/90 transition-colors duration-300"
                  aria-label="Show game information"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="p-2 text-white/60 hover:text-white/90 transition-colors duration-300"
                  aria-label="Show project information"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="mt-2 text text-white/60 tracking-[0.2em]
                       hover:text-white/80 transition-colors duration-300">
              DAILY CHALLENGES TO TEST YOUR MEDIA KNOWLEDGE
            </p>
          </header>
          
          {/* Button group with adjusted spacing */}
          <CategoryButtons 
            selectedDescription={selectedDescription} 
            onSelect={handleCategorySelect}
          />

          {!selectedDescription ? (
            <div className="space-y-4 text-center">
              <p className="text-xl text-white/80 tracking-wider">
                Select a category above to begin decrypting
              </p>
              <p className="text-white/60">
                Choose between Game, Movie, or TV Show descriptions to decrypt.
              </p>
              <button
                onClick={() => setShowInfoModal(true)}
                className="px-4 py-2 tracking-[0.2em] border border-white/20 bg-zinc-950/50 text-white rounded-md hover:bg-zinc-950/70 hover:border-white/30 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-300"
              >
                How to Play
              </button>
            </div>
          ) : (
            <div className="space-y-4 relative">
              <Suspense fallback={
                // Loading wheel
                <div className="flex justify-center items-center h-full">
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                </div>
              }>
                {selectedDescription === 'game' && (
                  <div>
                    {gameOverStates.game ? (
                      <div className="text-center p-8 border border-white/20 rounded-md bg-zinc-950/50">
                        <p className="text-2xl text-white/90">new game tomorrow :)</p>
                      </div>
                    ) : (
                      <GameDescription  
                        onGameDataLoad={handleGameData}
                        level={levels.game}
                        startDate={startDate}
                      />
                    )}
                  </div>
                )}
                {selectedDescription === 'movie' && (
                  <div>
                    {gameOverStates.movie ? (
                      <div className="text-center p-8 border border-white/20 rounded-md bg-zinc-950/50">
                        <p className="text-2xl text-white/90">new movie tomorrow :)</p>
                      </div>
                    ) : (
                      <MovieDescription 
                        onMovieDataLoad={handleGameData}
                        level={levels.movie}
                        startDate={startDate}
                      />
                    )}
                  </div>
                )}
                {selectedDescription === 'tv' && (
                  <div>
                    {gameOverStates.tv ? (
                      <div className="text-center p-8 border border-white/20 rounded-md bg-zinc-950/50">
                        <p className="text-2xl text-white/90">new tv show tomorrow :)</p>
                      </div>
                    ) : (
                      <TVDescription 
                        onTVShowDataLoad={handleGameData}
                        level={levels.tv}
                        startDate={startDate}
                      />
                    )}
                  </div>
                )}
              </Suspense>

              {!gameOverStates[selectedDescription] && (
                <>
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
                      onClick={handleGuessSubmit}
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
                        {renderDropdownItems}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {WinModal}
      {FailModal}
      {/* Add Info Modal - place before closing div */}
      <InfoPopUp showInfoModal={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <ProjectInfoPopUp showProjectModal={showProjectModal} onClose={() => setShowProjectModal(false)} />
    </div>
  );
}

export default memo(App);
