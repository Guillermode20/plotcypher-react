// database.js

const dbVersion = 1;
const dbName = "libraryDB";

// Connection pool manager
// 
const CONNECTION_POOL = {
    maxSize: 5,
    connections: [],
    async acquire() {
        if (this.connections.length < this.maxSize) {
            const db = await initDB();
            this.connections.push(db);
            return db;
        }
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (this.connections.length) {
                    clearInterval(interval);
                    resolve(this.connections[0]);
                }
            }, 100);
        });
    },
    release(db) {
        this.connections = this.connections.filter(conn => conn !== db);
    }
};

// Initialize IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            ['games', 'movies', 'tv'].forEach(store => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store, { keyPath: 'ID' });
                }
            });
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject(event.target.error);
    });
}

// Cache configuration
const CACHE_CONFIG = {
    maxSize: 1000,
    expirationTime: 1000 * 60 * 60,
    version: '1.0',
    preloadChunkSize: 50
};

// LRU cache implementation
class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    get(key) {
        if (!this.cache.has(key)) return null;
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }
    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            this.cache.delete(this.cache.keys().next().value);
        }
        this.cache.set(key, value);
    }
}

// Cached data stores
const cache = {
    games: new LRUCache(1000),
    movies: new LRUCache(1000),
    tv: new LRUCache(1000),
    metadata: {
        games: new Map(),
        movies: new Map(),
        tv: new Map()
    }
};

// Cache item operations
function setCacheItem(store, id, item) {
    const cacheStore = cache[store];
    const metadataStore = cache.metadata[store];
    if (cacheStore.size >= CACHE_CONFIG.maxSize) {
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
    metadata.accessCount++;
    metadata.timestamp = Date.now();
    return item;
}

// Retry mechanism
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

// Circuit breaker
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

// Database worker
const dbWorker = new Worker(new URL('./dbWorker.js', import.meta.url));

// Data fetching
const FETCH_CONFIG = {
    batchSize: 50,
    maxParallel: 3,
    retryAttempts: 3,
    retryDelay: 1000,
    dataSources: {
        games: '/data/videogames.json',
        movies: '/data/movies.json',
        tv: '/data/tvshows.json'
    }
};

async function fetchData(category) {
    const categoryMap = {
        games: 'games',
        movies: 'movies',
        tvshows: 'tv',
        tv: 'tv',
        game: 'games',
        movie: 'movies'
    };
    const normalizedCategory = categoryMap[category.toLowerCase()] || category;
    const cachedData = cache[normalizedCategory].get('data');
    const url = FETCH_CONFIG.dataSources[normalizedCategory];
    if (cachedData) return cachedData;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        const data = JSON.parse(text);
        const validData = data.filter(item => item && typeof item === 'object' && item.ID && item.Name && item.Description && (item.ReleaseYear || item.Year));
        const normalizedData = validData.map(item => ({ ...item, ReleaseYear: item.ReleaseYear || item.Year }));
        cache[normalizedCategory].set('data', normalizedData);
        return normalizedData;
    } catch {
        if (cachedData) return cachedData;
        return [];
    }
}

export const getAllGames = () => fetchData('games');
export const getAllMovies = () => fetchData('movies');
export const getAllTVShows = () => fetchData('tv');

// Batch operations
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

// Preload cache
async function preloadCache() {
    const stores = ['games', 'movies', 'tv'];
    for (const store of stores) {
        const items = await fetchData(store);
        items.forEach(item => setCacheItem(store, item.ID, item));
    }
}

// Cache management
export const clearCache = () => {
    ['games', 'movies', 'tv'].forEach(store => {
        cache[store].clear();
        cache.metadata[store].clear();
    });
};

export const getCacheStats = () => ({
    size: {
        games: cache.games.size,
        movies: cache.movies.size,
        tv: cache.tv.size
    },
    metadata: cache.metadata
});

// Batch get
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

// Get item by ID
async function getItemById(category, id) {
    const categoryMap = {
        games: 'games',
        movies: 'movies',
        tvshows: 'tv',
        tv: 'tv',
        game: 'games',
        movie: 'movies'
    };
    const normalizedCategory = categoryMap[category.toLowerCase()] || category;
    return getCacheItem(normalizedCategory, id) || null;
}

// Get daily item
async function getDailyItem(category, id) {
    try {
        const items = await fetchData(category);
        return items.find(item => item.ID === Number(id)) || null;
    } catch (error) {
        console.error(`Error fetching daily ${category} item:`, error);
        return null;
    }
}

export {
    initDB,
    getItemById,
    batchAdd,
    queryByIndex,
    withRetry,
    batchGet,
    preloadCache,
    circuitBreaker,
    dbWorker,
    getDailyItem
};