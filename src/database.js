// database.js

const dbVersion = 1;

// Reintroduce the dbName variable
const dbName = "libraryDB";

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
    data: new Map(),
    maxSize: 1000,
    ttl: 60 * 60 * 1000, // 1 hour TTL
    games: new Map(),
    movies: new Map(),
    tv: new Map(),
    metadata: {
        games: new Map(),
        movies: new Map(),
        tv: new Map()
    },

    set(key, value) {
        if (this.data.size >= this.maxSize) {
            // Remove oldest entry
            const firstKey = this.data.keys().next().value;
            this.data.delete(firstKey);
        }

        this.data.set(key, {
            value,
            timestamp: Date.now()
        });
    },

    get(key) {
        const item = this.data.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
            this.data.delete(key);
            return null;
        }

        return item.value;
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

// Update database operations to use fetchData
async function getGame(id) {
    const games = await fetchData('games');
    const game = games.find(g => g.ID === Number(id));
    if (!game) {
        console.warn(`Game with ID ${id} not found`);
        return null;
    }
    return game;
}

// Get movie by ID
async function getMovie(id) {
    const movies = await fetchData('movies');
    const movie = movies.find(m => m.ID === Number(id));
    if (!movie) {
        console.warn(`Movie with ID ${id} not found`);
        return null;
    }
    return movie;
}

// Get TV show by ID
async function getTVShow(id) {
    const shows = await fetchData('tv');
    const show = shows.find(t => t.ID === Number(id));
    if (!show) {
        console.warn(`TV show with ID ${id} not found`);
        return null;
    }
    return show;
}

// Add batch size and parallel loading configuration
const FETCH_CONFIG = {
    batchSize: 50,
    maxParallel: 3,
    retryAttempts: 3,
    retryDelay: 1000,
    dataSources: {
        game: '/data/videogames.json',
        games: '/data/videogames.json',
        movie: '/data/movies.json',
        movies: '/data/movies.json',
        tv: '/data/tvshows.json',
        tvshows: '/data/tvshows.json'
    }
};

// Improved data fetching with better category normalization
const fetchData = async (category) => {
    // Normalize category name
    const categoryMap = {
        games: 'game',
        movies: 'movie',
        tvshows: 'tv',
        tv: 'tv',
        game: 'game',
        movie: 'movie'
    };

    const normalizedCategory = categoryMap[category.toLowerCase()] || category;
    const cacheKey = `${normalizedCategory}_data`;
    const cachedData = cache.get(cacheKey);
    const url = FETCH_CONFIG.dataSources[normalizedCategory];

    console.log(`Attempting to fetch ${normalizedCategory} data from ${url}`);

    if (!url) {
        console.error(`Invalid category: ${category}`);
        throw new Error(`Invalid category: ${category}`);
    }

    if (cachedData) {
        console.log(`Returning cached ${normalizedCategory} data:`, cachedData.length, 'items');
        return cachedData;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        console.log(`Fetching ${normalizedCategory} data from ${url}`);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const text = await response.text(); // Get response as text first
        console.log(`Raw ${normalizedCategory} response:`, text.substring(0, 200) + '...'); // Log first 200 chars

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error(`JSON parse error for ${normalizedCategory}:`, e);
            throw e;
        }

        // Log the structure of the data
        console.log(`${normalizedCategory} data structure:`, {
            isArray: Array.isArray(data),
            length: Array.isArray(data) ? data.length : Object.keys(data).length,
            sampleItem: Array.isArray(data) ? data[0] : Object.values(data)[0]
        });

        // Ensure data is properly structured and validate items
        const validData = data.filter(item => {
            const isValid = item &&
                typeof item === 'object' &&
                item.ID &&
                item.Name &&
                item.Description &&
                (item.ReleaseYear || item.Year);

            if (!isValid) {
                console.warn(`Invalid ${normalizedCategory} item:`, item);
            }
            return isValid;
        });

        // Normalize the data structure
        const normalizedData = validData.map(item => ({
            ...item,
            ReleaseYear: item.ReleaseYear || item.Year // Handle both field names
        }));

        cache.set(cacheKey, normalizedData);
        return normalizedData;

    } catch (error) {
        console.error(`Error fetching ${normalizedCategory} data from ${url}:`, error);
        if (cachedData) {
            console.log(`Falling back to cached ${normalizedCategory} data`);
            return cachedData;
        }
        return [];
    }
};

// Updated fetch functions with shared caching logic
export const getAllGames = () => fetchData('games');
export const getAllMovies = () => fetchData('movies');
export const getAllTVShows = () => fetchData('tv');

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
        const items = await fetchData(store);
        items.forEach(item => setCacheItem(store, item.ID, item));
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
    const categoryMap = {
        games: 'game',
        movies: 'movie',
        tvshows: 'tv',
        tv: 'tv',
        game: 'game',
        movie: 'movie'
    };

    const normalizedCategory = categoryMap[category.toLowerCase()];
    const cacheName = `daily_${normalizedCategory}_${id}`;
    const cachedItem = cache.get(cacheName);

    if (cachedItem) {
        console.log(`Cache hit for ${category} ${id}`);
        return cachedItem;
    }

    try {
        // Add category validation
        if (!FETCH_CONFIG.dataSources[category]) {
            throw new Error(`Invalid category: ${category}`);
        }

        const baseUrl = window.location.origin;
        const dataPath = FETCH_CONFIG.dataSources[category];
        const url = `${baseUrl}${dataPath.startsWith('/') ? '' : '/'}${dataPath}`;

        console.log(`Fetching ${category} item ${id} from ${url}`);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON but received ${contentType}`);
        }

        const data = await response.json();
        const item = Array.isArray(data)
            ? data.find(item => item.ID === Number(id))
            : Object.values(data).find(item => item.ID === Number(id));

        if (item) {
            cache.set(cacheName, item);
            return item;
        }

        console.warn(`${category} item ${id} not found`);
        return null;

    } catch (error) {
        console.error(`Error fetching ${category} item ${id}:`, error);
        return cachedItem || null;
    }
}

// Add to database.js
async function getDailyItem(category, id) {
    try {
        const items = await fetchData(category);
        return items.find(item => item.ID === Number(id)) || null;
    } catch (error) {
        console.error(`Error fetching daily ${category} item:`, error);
        return null;
    }
}

export { getItemById };

export {
    initDB,
    getGame,
    getMovie,
    getTVShow,
    batchAdd,
    queryByIndex,
    withRetry,
    batchGet,
    preloadCache,  // Export the preloadCache function
    circuitBreaker,
    dbWorker,  // only if needed by other modules
    getDailyItem
};