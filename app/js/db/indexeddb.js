// app/js/db/indexeddb.js

let db;
const DB_NAME = "CostScopeDB";
const DB_VERSION = 3;

// For each version, we define a function to upgrade the schema.
const migrations = {
  // Version 3 introduces the full schema from Bloque 2
  3: (db, transaction) => {
    console.log("Applying migration for version 3...");
    // Clean up old stores if they exist
    if (db.objectStoreNames.contains("costs")) {
      db.deleteObjectStore("costs");
    }
    if (db.objectStoreNames.contains("resources")) {
      db.deleteObjectStore("resources");
    }

    // transactions: { txId, name, customerId?, product?, phase, timestamp }
    if (!db.objectStoreNames.contains("transactions")) {
      db.createObjectStore("transactions", { keyPath: "txId" });
    }

    // spans: { spanId, txId, parentSpanId?, serviceName, operation, start, end, attrs }
    if (!db.objectStoreNames.contains("spans")) {
      const spansStore = db.createObjectStore("spans", { keyPath: "spanId" });
      spansStore.createIndex("by_txId", "txId", { unique: false });
    }

    // resources: { resourceId, name, type, env, provider?, migrated, tags }
    if (!db.objectStoreNames.contains("resources")) {
      db.createObjectStore("resources", { keyPath: "resourceId" });
    }

    // costs: { auto, resourceId, period, costUSD, currency?, usage?, unit? }
    if (!db.objectStoreNames.contains("costs")) {
      const costsStore = db.createObjectStore("costs", { autoIncrement: true });
      costsStore.createIndex("by_resourceId", "resourceId", { unique: false });
      costsStore.createIndex("by_period", "period", { unique: false });
    }

    // mappings: { id, name, match, allocate, weight? }
    if (!db.objectStoreNames.contains("mappings")) {
      db.createObjectStore("mappings", { autoIncrement: true });
    }

    // settings: key-value store
    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings", { keyPath: "key" });
    }

    // imports: { id, fileName, source, rows, when }
    if (!db.objectStoreNames.contains("imports")) {
      db.createObjectStore("imports", { keyPath: "id", autoIncrement: true });
    }
  },
};

export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", event.target.errorCode);
      reject(event.target.errorCode);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("Database opened successfully.");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const transaction = event.target.transaction;
      const oldVersion = event.oldVersion;
      console.log(
        `Upgrading database from version ${oldVersion} to ${DB_VERSION}...`,
      );

      for (let v = oldVersion + 1; v <= DB_VERSION; v++) {
        if (migrations[v]) {
          migrations[v](db, transaction);
        }
      }
    };
  });
}

export function getDB() {
  if (!db) {
    throw new Error("Database is not initialized. Call initDB first.");
  }
  return db;
}

export function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const db = getDB();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
  });
}

export async function saveData(storeName, data, validator) {
  // 1. Validate all data before starting the transaction
  if (validator) {
    for (const item of data) {
      if (!validator(item)) {
        const errorMsg = `Validation failed for item in ${storeName}`;
        console.error(errorMsg, item);
        // Reject the promise if validation fails for any item
        return Promise.reject(new Error(errorMsg));
      }
    }
  }

  // 2. If all data is valid, proceed with the transaction
  const db = getDB();
  const transaction = db.transaction([storeName], "readwrite");
  const store = transaction.objectStore(storeName);

  const promises = data.map((item) => {
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });

  await Promise.all(promises);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log(`Data saved to ${storeName} successfully.`);
      resolve();
    };
    transaction.onerror = (event) => {
      console.error(`Error saving data to ${storeName}:`, event.target.error);
      reject(event.target.error);
    };
  });
}
