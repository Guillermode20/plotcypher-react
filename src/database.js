// database.js

const dbName = "libraryDB";
const dbVersion = 1;

// Open database connection
function initDB() {
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

        request.onsuccess = (event) => resolve(event.target.result);
    });
}

// Add caching mechanism
const cache = {
    games: new Map(),
    movies: new Map(),
    tv: new Map()
};

// Get game by ID
async function getGame(id) {
    if (cache.games.has(id)) {
        return cache.games.get(id);
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["games"], "readonly");
        const store = transaction.objectStore("games");
        const request = store.get(id);

        request.onsuccess = () => {
            const result = request.result;
            cache.games.set(id, result);
            resolve(result);
        };
        request.onerror = () => reject(request.error);
    });
}

// Get movie by ID
async function getMovie(id) {
    if (cache.movies.has(id)) {
        return cache.movies.get(id);
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["movies"], "readonly");
        const store = transaction.objectStore("movies");
        const request = store.get(id);

        request.onsuccess = () => {
            const result = request.result;
            cache.movies.set(id, result);
            resolve(result);
        };
        request.onerror = () => reject(request.error);
    });
}

// Get TV show by ID
async function getTVShow(id) {
    if (cache.tv.has(id)) {
        return cache.tv.get(id);
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["tv"], "readonly");
        const store = transaction.objectStore("tv");
        const request = store.get(id);

        request.onsuccess = () => {
            const result = request.result;
            cache.tv.set(id, result);
            resolve(result);
        };
        request.onerror = () => reject(request.error);
    });
}

// Function to get all games
export const getAllGames = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['games'], 'readonly');
        const store = transaction.objectStore('games');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
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

        request.onsuccess = () => resolve(request.result);
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

        request.onsuccess = () => resolve(request.result);
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

// Add cache clearing function for daily resets
export const clearCache = () => {
    cache.games.clear();
    cache.movies.clear();
    cache.tv.clear();
};

export { initDB, getGame, getMovie, getTVShow, populateDB };