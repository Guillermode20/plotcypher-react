import { useState, useEffect, useRef, useCallback, Suspense, lazy, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import LoadingScreen from './core/LoadingScreen.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { getAllGames, getAllMovies, getAllTVShows } from './database';

const InfoPopUp = lazy(() => import('./components/InfoPopUp'));
const ProjectInfoPopUp = lazy(() => import('./components/ProjectInfoPopUp'));
const GameDescription = lazy(() => import('./components/GameDescription'));
const MovieDescription = lazy(() => import('./components/MovieDescription'));
const TVDescription = lazy(() => import('./components/TVDescription'));
const WinModal = lazy(() => import('./components/WinModal'));
const FailModal = lazy(() => import('./components/FailModal'));
const GameOverScreen = lazy(() => import('./components/GameOverScreen'));

const TESTING_MODE = false;

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

const initialGameState = {
  levels: { game: 4, movie: 4, tv: 4 },
  attempts: { game: 0, movie: 0, tv: 0 },
  gameOverStates: { game: false, movie: false, tv: false }
};

function App() {
  const startDate = '2024-11-08';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0); 
    return () => clearTimeout(timer);
  }, []);

  const [selectedDescription, setSelectedDescription] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameState, setGameState] = useState(() => {
    if (TESTING_MODE) return initialGameState;
    
    const lastDate = localStorage.getItem('lastPlayedDate');
    const today = new Date().toDateString();
    
    if (lastDate !== today) return initialGameState;
    
    return {
      levels: JSON.parse(localStorage.getItem('levels')) || initialGameState.levels,
      attempts: JSON.parse(localStorage.getItem('attempts')) || initialGameState.attempts,
      gameOverStates: JSON.parse(localStorage.getItem('gameOverStates')) || initialGameState.gameOverStates
    };
  });
  const dropdownRef = useRef(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState('down');
  const inputRef = useRef(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const handleGameData = useCallback((data) => {
    setGameData(data);
  }, []); 

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

  useEffect(() => {
    import('./components/GameDescription.jsx');
    import('./components/MovieDescription.jsx');
    import('./components/TVDescription.jsx');
  }, []);

  const updateDropdownDirection = useCallback(() => {
    if (!inputRef.current) return;
    
    const inputRect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceNeeded = 240; 
    
    setDropdownDirection(spaceBelow < spaceNeeded ? 'up' : 'down');
  }, []);

  useEffect(() => {
    if (showDropdown) {
      updateDropdownDirection();
      window.addEventListener('resize', updateDropdownDirection);
      return () => window.removeEventListener('resize', updateDropdownDirection);
    }
  }, [showDropdown, updateDropdownDirection]);

  const updateLocalStorage = useCallback((newState) => {
    if (TESTING_MODE) return;
    
    const updates = {
      levels: JSON.stringify(newState.levels),
      attempts: JSON.stringify(newState.attempts),
      gameOverStates: JSON.stringify(newState.gameOverStates),
      lastPlayedDate: new Date().toDateString()
    };

    Object.entries(updates).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }, []);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (TESTING_MODE || (!hasVisited && !TESTING_MODE)) {
      setShowInfoModal(true);
      if (!TESTING_MODE) {
        localStorage.setItem('hasVisitedBefore', 'true');
      }
    }
  }, []);

  const [allTitles, setAllTitles] = useState({ games: [], movies: [], tv: [] });

  useEffect(() => {
    const loadAllTitles = async () => {
      try {
        const [games, movies, tvShows] = await Promise.all([
          getAllGames(),
          getAllMovies(),
          getAllTVShows()
        ]);
        setAllTitles({
          games: games.map(game => game.gameName),
          movies: movies.map(movie => movie.gameName),
          tv: tvShows.map(show => show.gameName)
        });
      } catch (error) {
        console.error('Error loading titles:', error);
      }
    };
    loadAllTitles();
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!searchInput || searchInput.length < 1 || !selectedDescription) return [];
      
    const suggestions = allTitles[selectedDescription === 'tv' ? 'tv' : 
                                selectedDescription === 'movie' ? 'movies' : 
                                'games'];
    
    if (!suggestions) return [];
      
    const searchQuery = searchInput.toLowerCase();
    const maxResults = 10;
    let results = [];
      
    const exactMatch = suggestions.find(item => 
      item && item.toLowerCase() === searchQuery
    );
    if (exactMatch) return [exactMatch];
  
    suggestions.forEach(item => {
      if (results.length >= maxResults) return;
      if (item && item.toLowerCase().startsWith(searchQuery)) {
        results.push(item);
      }
    });
  
    if (results.length < maxResults) {
      suggestions.forEach(item => {
        if (results.length >= maxResults) return;
        if (item && !item.toLowerCase().startsWith(searchQuery) && 
            item.toLowerCase().includes(searchQuery) &&
            !results.includes(item)) {
          results.push(item);
        }
      });
    }
  
    return results;
  }, [searchInput, selectedDescription, allTitles]);

  const handleGuessSubmit = useCallback(() => {
    if (!gameData) return;
    const userInput = searchInput.toLowerCase();
    
    const correctAnswer = {
      game: gameData.correctGame,
      movie: gameData.correctMovie,
      tv: gameData.correctTVShow
    }[selectedDescription]?.toLowerCase();
  
    if (userInput === correctAnswer) {
      setGameState(prev => {
        const newState = {
          ...prev,
          gameOverStates: {
            ...prev.gameOverStates,
            [selectedDescription]: true
          }
        };
        updateLocalStorage(newState);
        return newState;
      });
      setShowWinModal(true);
      return;
    }
  
    setGameState(prev => {
      const updatedLevel = Math.max(-1, prev.levels[selectedDescription] - 1);
      const newState = {
        ...prev,
        levels: {
          ...prev.levels,
          [selectedDescription]: updatedLevel
        },
        attempts: {
          ...prev.attempts,
          [selectedDescription]: prev.attempts[selectedDescription] + 1
        },
        gameOverStates: {
          ...prev.gameOverStates,
          [selectedDescription]: updatedLevel <= -1
        }
      };
      updateLocalStorage(newState);
      
      if (updatedLevel <= -1) {
        setShowFailModal(true);
      }
      
      return newState;
    });
  
    setShowDropdown(false);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 1000);
  }, [gameData, searchInput, selectedDescription, updateLocalStorage]);

  const handleCategorySelect = useCallback((category) => {
    setSelectedDescription(category);
  }, []);

  const debouncedSetSearchInput = useMemo(() => {
    let timeoutId;
    return (value) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setSearchInput(value), 50); 
    };
  }, []);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    e.target.value = value;
    debouncedSetSearchInput(value);
    setShowDropdown(true);
  }, [debouncedSetSearchInput]);

  const renderDropdownItems = useMemo(() => (
    filteredSuggestions.map((item, index) => (
      <li
        key={index}
        className="px-4 py-2 cursor-pointer text-white/70 hover:text-white hover:bg-zinc-800/50 transition-all duration-200 block w-full text-left"
        onClick={() => {
          debouncedSetSearchInput(item);
          setSearchInput(item);
          setShowDropdown(false);
        }}
      >
        {item}
      </li>
    ))
  ), [filteredSuggestions, debouncedSetSearchInput]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <ErrorBoundary>
          <div className="relative min-h-screen bg-zinc-950 bg-gradient-to-b from-zinc-950 to-zinc-900 text-white font-mono scrollbar-gutter-stable">
            <div className="container relative mx-auto px-0 sm:px-4 py-0 sm:py-8">
              <div className="max-w-2xl mx-auto p-0 sm:p-4 
                backdrop-blur-sm bg-zinc-950/80 border border-white/20 
                rounded-none sm:rounded-lg shadow-xl drop-shadow-glow hover:shadow-2xl
                transition-all duration-300
                box-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <header className="p-2 sm:p-4 relative border border-white/20 bg-zinc-950/50 rounded-md
                              hover:border-white/30 transition-all duration-300 mb-2 sm:mb-4">
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
                          {gameState.gameOverStates.game ? (
                            <GameOverScreen gameState={gameState} category="game" />
                          ) : (
                            <GameDescription  
                              onGameDataLoad={handleGameData}
                              level={gameState.levels.game}
                              startDate={startDate}
                            />
                          )}
                        </div>
                      )}
                      {selectedDescription === 'movie' && (
                        <div>
                          {gameState.gameOverStates.movie ? (
                            <GameOverScreen gameState={gameState} category="movie" />
                          ) : (
                            <MovieDescription 
                              onMovieDataLoad={handleGameData}
                              level={gameState.levels.movie}
                              startDate={startDate}
                            />
                          )}
                        </div>
                      )}
                      {selectedDescription === 'tv' && (
                        <div>
                          {gameState.gameOverStates.tv ? (
                            <GameOverScreen gameState={gameState} category="tv" />
                          ) : (
                            <TVDescription 
                              onTVShowDataLoad={handleGameData}
                              level={gameState.levels.tv}
                              startDate={startDate}
                            />
                          )}
                        </div>
                      )}
                    </Suspense>

                    {!gameState.gameOverStates[selectedDescription] && (
                      <>
                        <p className={`inline-block px-4 py-2 
                          text text-white/60 tracking-[0.2em]
                          border border-white/20 rounded-md
                          bg-zinc-950/50 hover:bg-zinc-950/70
                          hover:border-white/30
                          transition-all duration-300
                          ${isFlashing ? 'animate-flash' : ''}`}>
                          DECRYPTION ATTEMPTS REMAINING: <span className="text-white/90">{ gameState.levels[selectedDescription] + 1 }</span>
                        </p>
                        <div className="relative flex flex-col sm:flex-row gap-1 sm:gap-2" ref={dropdownRef}>
                          <input
                            ref={inputRef}
                            type="text"
                            value={searchInput}
                            onChange={handleInputChange}
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
                            className="w-full sm:w-auto px-4 sm:px-6 py-2
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
                          {showDropdown && searchInput && gameData && gameState.levels[selectedDescription] <= 4 && (
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
            <WinModal 
              isOpen={showWinModal}
              onClose={() => setShowWinModal(false)}
              selectedDescription={selectedDescription}
              gameState={gameState}
              gameData={gameData}
            />
            <FailModal
              isOpen={showFailModal}
              onClose={() => setShowFailModal(false)}
              selectedDescription={selectedDescription}
              gameData={gameData}
            />
            <InfoPopUp showInfoModal={showInfoModal} onClose={() => setShowInfoModal(false)} />
            <ProjectInfoPopUp showProjectModal={showProjectModal} onClose={() => setShowProjectModal(false)} />
          </div>
        </ErrorBoundary>
      </Suspense>
    </ErrorBoundary>
  );
}

export default memo(App);
