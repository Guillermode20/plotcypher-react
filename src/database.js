// database.js

const dbName = "libraryDB";
const dbVersion = 1;

// Add DB connection pooling
let dbConnection = null;

// Improved database initialization
async function initDB() {
    if (dbConnection) return dbConnection;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => reject(`Database error: ${event.target.error}`);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create object stores
            const gameStore = db.createObjectStore("games", { keyPath: "id", autoIncrement: true });
            gameStore.createIndex("gameNameIndex", "gameName", { unique: true });
            gameStore.createIndex("releaseYearIndex", "releaseYear", { unique: false });
            gameStore.createIndex("genreIndex", "genre", { unique: false });

            const movieStore = db.createObjectStore("movies", { keyPath: "id", autoIncrement: true });
            movieStore.createIndex("movieNameIndex", "movieName", { unique: true });
            movieStore.createIndex("releaseYearIndex", "releaseYear", { unique: false });
            movieStore.createIndex("genreIndex", "genre", { unique: false });

            const tvStore = db.createObjectStore("tv", { keyPath: "id", autoIncrement: true });
            tvStore.createIndex("tvNameIndex", "tvName", { unique: true });
            tvStore.createIndex("releaseYearIndex", "releaseYear", { unique: false });
            tvStore.createIndex("genreIndex", "genre", { unique: false });
        };

        request.onsuccess = (event) => {
            dbConnection = event.target.result;
            resolve(dbConnection);
        };
    });
}

// Cache configuration
const CACHE_CONFIG = {
    maxSize: 1000,  // maximum items per store
    expirationTime: 1000 * 60 * 60, // 1 hour in milliseconds
};

// Enhanced cache structure
const cache = {
    games: new Map(),
    movies: new Map(),
    tv: new Map(),
    metadata: {
        games: new Map(),  // stores timestamps and access counts
        movies: new Map(),
        tv: new Map(),
    }
};

// Optimize cache eviction using LRU with frequency
function setCacheItem(store, id, item) {
    const cacheStore = cache[store];
    const metadataStore = cache.metadata[store];

    if (cacheStore.size >= CACHE_CONFIG.maxSize) {
        // Use frequency and recency for eviction
        const oldest = [...metadataStore.entries()]
            .sort(([, a], [, b]) => {
                const scoreA = a.accessCount / (Date.now() - a.timestamp);
                const scoreB = b.accessCount / (Date.now() - b.timestamp);
                return scoreA - scoreB;
            })[0][0];
        cacheStore.delete(oldest);
        metadataStore.delete(oldest);
    }

    cacheStore.set(id, item);
    metadataStore.set(id, {
        timestamp: Date.now(),
        accessCount: 0
    });
}

function getCacheItem(store, id) {
    const item = cache[store].get(id);
    if (!item) return null;

    const metadata = cache.metadata[store].get(id);
    if (Date.now() - metadata.timestamp > CACHE_CONFIG.expirationTime) {
        cache[store].delete(id);
        cache.metadata[store].delete(id);
        return null;
    }

    // Update metadata
    metadata.accessCount++;
    metadata.timestamp = Date.now();
    return item;
}

// Add retry mechanism for failed operations
async function withRetry(operation, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
        }
    }

    throw lastError;
}

// Get game by ID
async function getGame(id) {
    return withRetry(async () => {
        const cachedItem = getCacheItem('games', id);
        if (cachedItem) return cachedItem;

        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["games"], "readonly");
            const store = transaction.objectStore("games");
            const request = store.get(id);

            request.onsuccess = () => {
                const result = request.result;
                setCacheItem('games', id, result);
                resolve(result);
            };
            request.onerror = () => reject(request.error);
        });
    });
}

// Get movie by ID
async function getMovie(id) {
    return withRetry(async () => {
        const cachedItem = getCacheItem('movies', id);
        if (cachedItem) return cachedItem;

        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["movies"], "readonly");
            const store = transaction.objectStore("movies");
            const request = store.get(id);

            request.onsuccess = () => {
                const result = request.result;
                setCacheItem('movies', id, result);
                resolve(result);
            };
            request.onerror = () => reject(request.error);
        });
    });
}

// Get TV show by ID
async function getTVShow(id) {
    return withRetry(async () => {
        const cachedItem = getCacheItem('tv', id);
        if (cachedItem) return cachedItem;

        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["tv"], "readonly");
            const store = transaction.objectStore("tv");
            const request = store.get(id);

            request.onsuccess = () => {
                const result = request.result;
                setCacheItem('tv', id, result);
                resolve(result);
            };
            request.onerror = () => reject(request.error);
        });
    });
}

// Function to get all games
export const getAllGames = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['games'], 'readonly');
        const store = transaction.objectStore('games');
        const request = store.getAll();

        request.onsuccess = () => {
            // Batch cache all items
            request.result.forEach(game => {
                setCacheItem('games', game.id, game);
            });
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
};

// Function to get all movies
export const getAllMovies = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['movies'], 'readonly');
        const store = transaction.objectStore('movies');
        const request = store.getAll();

        request.onsuccess = () => {
            // Batch cache all items
            request.result.forEach(movie => {
                setCacheItem('movies', movie.id, movie);
            });
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
};

// Function to get all TV shows
export const getAllTVShows = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tv'], 'readonly');
        const store = transaction.objectStore('tv');
        const request = store.getAll();

        request.onsuccess = () => {
            // Batch cache all items
            request.result.forEach(tvShow => {
                setCacheItem('tv', tvShow.id, tvShow);
            });
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
};

// Populate DB
async function populateDB() {
    const db = await initDB();

    const populateStore = (storeName, jsonFile) => {
        return fetch(jsonFile)
            .then(response => response.json())
            .then(data => {
                const transaction = db.transaction([storeName], "readwrite");
                const store = transaction.objectStore(storeName);
                store.clear();
                data.forEach(item => store.add(item));
                return new Promise((resolve, reject) => {
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject(transaction.error);
                });
            });
    };

    await Promise.all([
        populateStore("games", "games.json"),
        populateStore("movies", "movies.json"),
        populateStore("tv", "tv.json"),
    ]);
}

// Add batch operations support
async function batchAdd(storeName, items) {
    const db = await initDB();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    return Promise.all(items.map(item => new Promise((resolve, reject) => {
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })));
}

// Add index-based querying
async function queryByIndex(storeName, indexName, value) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Add cache clearing function for daily resets
export const clearCache = () => {
    ['games', 'movies', 'tv'].forEach(store => {
        cache[store].clear();
        cache.metadata[store].clear();
    });
};

// Add cache statistics function
export const getCacheStats = () => {
    return {
        size: {
            games: cache.games.size,
            movies: cache.movies.size,
            tv: cache.tv.size
        },
        metadata: cache.metadata
    };
};

export { initDB, getGame, getMovie, getTVShow, populateDB, batchAdd, queryByIndex, withRetry };