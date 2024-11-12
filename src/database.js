// database.js

const dbVersion = 1;

// Reintroduce the dbName variable
const dbName = "libraryDB";

// Add DB connection pooling
let dbConnection = null;

// Add connection pool manager
const CONNECTION_POOL = {
    maxSize: 5,
    connections: new Set(),
    async acquire() {
        if (this.connections.size < this.maxSize) {
            const db = await initDB();
            this.connections.add(db);
            return db;
        }
        return new Promise(resolve => {
            const checkPool = () => {
                const db = Array.from(this.connections)[0];
                if (db) {
                    resolve(db);
                } else {
                    setTimeout(checkPool, 100);
                }
            };
            checkPool();
        });
    },
    release(db) {
        if (this.connections.has(db)) {
            this.connections.delete(db);
        }
    }
};

// Update initDB to initialize IndexedDB and return the db object
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            ['games', 'movies', 'tv'].forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'ID' });
                }
            });
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Cache configuration
const CACHE_CONFIG = {
    maxSize: 1000,  // maximum items per store
    expirationTime: 1000 * 60 * 60, // 1 hour in milliseconds
    version: '1.0',
    preloadChunkSize: 50
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
        accessCount: 0,
        version: CACHE_CONFIG.version
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

// Add circuit breaker
const circuitBreaker = {
    failures: 0,
    lastFailure: null,
    threshold: 5,
    resetTimeout: 30000,
    async execute(operation) {
        if (this.isOpen()) {
            throw new Error('Circuit breaker is open');
        }
        try {
            const result = await operation();
            this.reset();
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    },
    isOpen() {
        if (!this.lastFailure) return false;
        if (Date.now() - this.lastFailure > this.resetTimeout) {
            this.reset();
            return false;
        }
        return this.failures >= this.threshold;
    },
    recordFailure() {
        this.failures++;
        this.lastFailure = Date.now();
    },
    reset() {
        this.failures = 0;
        this.lastFailure = null;
    }
};

// Update the worker initialization
const dbWorker = new Worker(new URL('./dbWorker.js', import.meta.url));

// Add worker message handler
const workerRequest = (type, payload) => {
    return new Promise((resolve, reject) => {
        const messageHandler = (e) => {
            if (e.data.type === 'SUCCESS') {
                resolve(e.data.payload);
            } else if (e.data.type === 'ERROR') {
                reject(new Error(e.data.payload));
            }
            dbWorker.removeEventListener('message', messageHandler);
        };

        dbWorker.addEventListener('message', messageHandler);
        dbWorker.postMessage({ type, payload });
    });
};

// Update database operations to use worker
async function getGame(id) {
    const game = cache.games.get(id);
    if (!game) {
        console.warn(`Game with ID ${id} not found in cache`);
        return null;
    }
    return game;
}

// Get movie by ID
async function getMovie(id) {
    const movie = cache.movies.get(id);
    if (!movie) {
        console.warn(`Movie with ID ${id} not found in cache`);
        return null;
    }
    return movie;
}

// Get TV show by ID
async function getTVShow(id) {
    const tvShow = cache.tv.get(id);
    if (!tvShow) {
        console.warn(`TV show with ID ${id} not found in cache`);
        return null;
    }
    return tvShow;
}

// Function to get all games
export const getAllGames = async () => {
    const response = await fetch('/videogames.json');
    if (!response.ok) {
        console.error('Failed to fetch games data');
        return [];
    }
    const data = await response.json();
    console.log('Fetched games:', data);
    return data;
};

// Function to get all movies
export const getAllMovies = async () => {
    const response = await fetch('/movies.json');
    if (!response.ok) {
        console.error('Failed to fetch movies data');
        return [];
    }
    const data = await response.json();
    console.log('Fetched movies:', data);
    return data;
};

// Function to get all TV shows
export const getAllTVShows = async () => {
    const response = await fetch('/tvshows.json');
    if (!response.ok) {
        console.error('Failed to fetch TV shows data');
        return [];
    }
    const data = await response.json();
    console.log('Fetched TV shows:', data);
    return data;
};

// Ensure populateDB acquires and releases the db connection properly
async function populateDB() {
    const db = await CONNECTION_POOL.acquire();
    try {
        const gamesResponse = await fetch('/videogames.json');
        const gamesData = await gamesResponse.json();
        await batchAdd('games', gamesData);

        const moviesResponse = await fetch('/movies.json');
        const moviesData = await moviesResponse.json();
        await batchAdd('movies', moviesData);

        const tvShowsResponse = await fetch('/tvshows.json');
        const tvShowsData = await tvShowsResponse.json();
        await batchAdd('tv', tvShowsData);
    } catch (error) {
        console.error('Error populating DB:', error);
    } finally {
        CONNECTION_POOL.release(db);
    }
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

// Preload frequently accessed data
async function preloadCache() {
    const stores = ['games', 'movies', 'tv'];
    for (const store of stores) {
        const items = await queryByIndex(store, 'accessCount', IDBKeyRange.lowerBound(5));
        items.forEach(item => setCacheItem(store, item.id, item));
    }
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

// Batch operations for better performance
async function batchGet(storeName, ids) {
    const db = await CONNECTION_POOL.acquire();
    try {
        return await circuitBreaker.execute(async () => {
            const cached = ids.map(id => getCacheItem(storeName, id)).filter(Boolean);
            const missingIds = ids.filter(id => !getCacheItem(storeName, id));

            if (!missingIds.length) return cached;

            const transaction = db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const promises = missingIds.map(id => new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = () => {
                    if (request.result) setCacheItem(storeName, id, request.result);
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            }));

            const fetched = await Promise.all(promises);
            return [...cached, ...fetched];
        });
    } finally {
        CONNECTION_POOL.release(db);
    }
}

// Update getItemById to fetch data from public folder
async function getItemById(category, id) {
    let response;
    if (category === 'movie') {
        response = await fetch('/movies.json');
    } else if (category === 'tv') {
        response = await fetch('/tvshows.json');
    } else if (category === 'game') {
        response = await fetch('/videogames.json');
    } else {
        return null;
    }

    if (!response.ok) {
        console.error(`Failed to fetch ${category} data`);
        return null;
    }

    const items = await response.json();
    return items.find(item => item.ID === id);
}

export { getItemById };

export {
    initDB,
    getGame,
    getMovie,
    getTVShow,
    populateDB,
    batchAdd,
    queryByIndex,
    withRetry,
    batchGet,
    preloadCache,
    circuitBreaker,
    dbWorker  // only if needed by other modules
};