import { initDB } from './db/indexeddb.js';
import { loadSampleData } from './ingest/loader.js';

async function main() {
    // Initialize the database
    try {
        await initDB();
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return; // Stop execution if DB fails to initialize
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // --- UI Event Listeners ---

    // Button to load sample data
    const loadSampleDataButton = document.getElementById('loadSampleDataButton');
    if (loadSampleDataButton) {
        loadSampleDataButton.addEventListener('click', () => {
            loadSampleData();
        });
    }

    // Button to import a custom file
    const importButton = document.getElementById('importButton');
    if (importButton) {
        importButton.addEventListener('click', async () => {
            try {
                const [fileHandle] = await window.showOpenFilePicker();
                const file = await fileHandle.getFile();
                const contents = await file.text();
                console.log('File content:', contents);
                // Here, you would call parsers and saveData functions
            } catch (error) {
                console.error('Error importing file:', error);
            }
        });
    }

    // Button for background calculations
    const calculateButton = document.getElementById('calculateButton');
    const worker = new Worker('js/workers/aggs.worker.js', { type: 'module' });

    worker.onmessage = event => {
        console.log('Worker returned:', event.data);
    };

    if (calculateButton) {
        calculateButton.addEventListener('click', () => {
            worker.postMessage(10);
        });
    }
}

main();
