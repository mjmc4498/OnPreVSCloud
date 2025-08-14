// app/js/ingest/loader.js
import { parseCSV } from './csv_parser.js';
import { saveData } from '../db/indexeddb.js';

async function fetchAndProcessCSV(filePath, storeName) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }
        const csvText = await response.text();
        const data = parseCSV(csvText);
        await saveData(storeName, data);
        console.log(`Successfully loaded data from ${filePath} into ${storeName}.`);
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

export async function loadSampleData() {
    console.log('Loading sample data...');
    await fetchAndProcessCSV('sample-data/costs.csv', 'costs');
    await fetchAndProcessCSV('sample-data/resources.csv', 'resources');
    console.log('Sample data loading complete.');
}
