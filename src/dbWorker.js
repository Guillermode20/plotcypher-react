// src/dbWorker.js
const dbName = "libraryDB";
const dbVersion = 1;

const dbOperations = {
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);

            request.onerror = (event) => reject(`Database error: ${event.target.error}`);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores with indexes
                const gameStore = db.createObjectStore("games", { keyPath: "id" });
                gameStore.createIndex("gameNameIndex", "gameName", { unique: true });
                gameStore.createIndex("releaseYearIndex", "releaseYear", { unique: false });
                gameStore.createIndex("genreIndex", "genre", { unique: false });

                const movieStore = db.createObjectStore("movies", { keyPath: "id" });
                movieStore.createIndex("movieNameIndex", "movieName", { unique: true });
                movieStore.createIndex("releaseYearIndex", "releaseYear", { unique: false });
                movieStore.createIndex("genreIndex", "genre", { unique: false });

                const tvStore = db.createObjectStore("tv", { keyPath: "id" });
                tvStore.createIndex("tvNameIndex", "tvName", { unique: true });
                tvStore.createIndex("releaseYearIndex", "releaseYear", { unique: false });
                tvStore.createIndex("genreIndex", "genre", { unique: false });
            };

            request.onsuccess = (event) => resolve(event.target.result);
        });
    },

    async getItem(storeName, id) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllItems(storeName) {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// Handle messages from main thread
self.onmessage = async (e) => {
    const { type, payload } = e.data;
    try {
        let result;
        switch (type) {
            case 'GET_ITEM':
                result = await dbOperations.getItem(payload.store, payload.id);
                break;
            case 'GET_ALL':
                result = await dbOperations.getAllItems(payload.store);
                break;
            default:
                throw new Error(`Unknown operation type: ${type}`);
        }
        self.postMessage({ type: 'SUCCESS', payload: result });
    } catch (error) {
        self.postMessage({ type: 'ERROR', payload: error.message });
    }
};