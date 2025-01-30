// database.js

const dbVersion = 1;
const dbName = "libraryDB";

// Connection pool manager
const CONNECTION_POOL = {
    maxSize: 5,
    connections: [],
    waiting: [],
    async acquire() {
        if (this.connections.length < this.maxSize) {
            try {
                const db = await initDB();
                this.connections.push(db);
                return db;
            } catch (error) {
                console.error("Error initializing database:", error);
                throw error;
            }
        }
        return new Promise(resolve => this.waiting.push(resolve));
    },
    release(db) {
        this.connections = this.connections.filter(conn => conn !== db);
        if (this.waiting.length) {
            const resolve = this.waiting.shift();
            resolve(this.connections[0]);
        }
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

// LRU cache implementation using Map and doubly linked list
class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.head = null;
        this.tail = null;
    }

    _moveToHead(key) {
        const node = this.cache.get(key);
        if (node === this.head) return;

        if (node.prev) node.prev.next = node.next;
        if (node.next) node.next.prev = node.prev;

        if (node === this.tail) this.tail = node.prev;

        node.prev = null;
        node.next = this.head;
        if (this.head) this.head.prev = node;
        this.head = node;
        if (!this.tail) this.tail = node;
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        const node = this.cache.get(key);
        this._moveToHead(key);
        return node.value;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            const node = this.cache.get(key);
            node.value = value;
            this._moveToHead(key);
            return;
        }

        const newNode = { key, value, prev: null, next: this.head };
        if (this.head) this.head.prev = newNode;
        this.head = newNode;
        if (!this.tail) this.tail = newNode;
        this.cache.set(key, newNode);

        if (this.cache.size > this.maxSize) {
            this.cache.delete(this.tail.key);
            this.tail = this.tail.prev;
            if (this.tail) this.tail.next = null;
            if (this.tail === null) this.head = null;
        }
    }

    delete(key) {
        if (!this.cache.has(key)) return;
        const node = this.cache.get(key);
        if (node.prev) node.prev.next = node.next;
        if (node.next) node.next.prev = node.prev;
        if (node === this.head) this.head = node.next;
        if (node === this.tail) this.tail = node.prev;
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
        this.head = null;
        this.tail = null;
    }
}

// Cached data stores
const cache = {
    games: new LRUCache(CACHE_CONFIG.maxSize),
    movies: new LRUCache(CACHE_CONFIG.maxSize),
    tv: new LRUCache(CACHE_CONFIG.maxSize),
};

// Cache item operations
function setCacheItem(store, id, item) {
    cache[store].set(id, {
        value: item,
        timestamp: Date.now(),
        accessCount: 0,
        version: CACHE_CONFIG.version
    });
}

function getCacheItem(store, id) {
    const cachedItem = cache[store].get(id);
    if (!cachedItem) return null;
    if (Date.now() - cachedItem.timestamp > CACHE_CONFIG.expirationTime) {
        cache[store].delete(id);
        return null;
    }
    cachedItem.accessCount++;
    cachedItem.timestamp = Date.now();
    return cachedItem.value;
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
    },
    async execute(operation) {
        if (this.isOpen()) {
            throw new Error("Circuit breaker is open");
        }
        try {
            return await operation();
        } catch (error) {
            this.recordFailure();
            throw error;
        }
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

function normalizeItem(item) {
    return { ...item, ReleaseYear: item.ReleaseYear || item.Year };
}

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
        const normalizedData = validData.map(normalizeItem);
        cache[normalizedCategory].set('data', normalizedData);
        return normalizedData;
    } catch (error) {
        console.error(`Error fetching ${normalizedCategory} data:`, error);
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
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const requests = items.map(item => store.add(item));
        Promise.all(requests.map(req => new Promise((res, rej) => {
            req.onsuccess = () => res(req.result);
            req.onerror = () => rej(req.error);
        }))).then(resolve).catch(reject);
    });
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
    await Promise.all(stores.map(async store => {
        const items = await fetchData(store);
        items.forEach(item => setCacheItem(store, item.ID, item));
    }));
}

// Cache management
export const clearCache = () => {
    ['games', 'movies', 'tv'].forEach(store => cache[store].clear());
};

export const getCacheStats = () => ({
    size: {
        games: cache.games.cache.size,
        movies: cache.movies.cache.size,
        tv: cache.tv.cache.size
    },
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