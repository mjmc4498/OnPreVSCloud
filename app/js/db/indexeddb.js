// app/js/db/indexeddb.js

let db;

export function initDB() {
    return new Promise((resolve, reject) => {
        const dbName = 'CostScopeDB';
        const dbVersion = 2; // Increment version to trigger upgrade

        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = event => {
            console.error('Database error:', event.target.errorCode);
            reject(event.target.errorCode);
        };

        request.onsuccess = event => {
            db = event.target.result;
            console.log('Database opened successfully.');
            resolve(db);
        };

        request.onupgradeneeded = event => {
            const db = event.target.result;

            if (db.objectStoreNames.contains('transactions')) {
                db.deleteObjectStore('transactions');
            }

            // Create costs object store
            if (!db.objectStoreNames.contains('costs')) {
                const costsStore = db.createObjectStore('costs', { keyPath: 'id', autoIncrement: true });
                costsStore.createIndex('resourceId', 'resourceId', { unique: false });
                costsStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Create resources object store
            if (!db.objectStoreNames.contains('resources')) {
                const resourcesStore = db.createObjectStore('resources', { keyPath: 'id', autoIncrement: true });
                resourcesStore.createIndex('resourceId', 'resourceId', { unique: false });
            }

            console.log('Database schema upgraded.');
        };
    });
}

export function getDB() {
    if (!db) {
        throw new Error('Database is not initialized. Call initDB first.');
    }
    return db;
}

export async function saveData(storeName, data) {
    const db = getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Clear existing data before adding new data
    store.clear();

    data.forEach(item => {
        store.add(item);
    });

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
            console.log(`Data saved to ${storeName} successfully.`);
            resolve();
        };
        transaction.onerror = event => {
            console.error(`Error saving data to ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}
