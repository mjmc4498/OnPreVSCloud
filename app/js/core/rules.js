// app/js/core/rules.js
import { getDB } from '../db/indexeddb.js';

/**
 * Fetches all allocation rules from the 'mappings' object store.
 * The rules are sorted by priority (lower number = higher priority).
 * @returns {Promise<Array>} A promise that resolves to an array of rule objects.
 */
export function getRules() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        if (!db) {
            return reject(new Error("Database not initialized."));
        }

        const transaction = db.transaction(['mappings'], 'readonly');
        const store = transaction.objectStore('mappings');
        const request = store.getAll();

        request.onerror = event => {
            console.error('Failed to fetch rules:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = event => {
            const rules = event.target.result;
            // Sort by priority, ascending. Rules without priority are treated as lowest.
            rules.sort((a, b) => (a.priority || 99) - (b.priority || 99));
            console.log('Fetched and sorted rules:', rules);
            resolve(rules);
        };
    });
}
