if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
            console.error('Service Worker registration failed:', error);
        });
}

// IndexedDB setup
const dbName = 'CostScopeDB';
const dbVersion = 1;

const request = indexedDB.open(dbName, dbVersion);

request.onerror = event => {
    console.error('Database error:', event.target.errorCode);
};

request.onupgradeneeded = event => {
    const db = event.target.result;
    const objectStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('cost', 'cost', { unique: false });
    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
    console.log('Database setup complete.');
};

// File System Access API for data import
const importButton = document.getElementById('importButton');

importButton.addEventListener('click', async () => {
    try {
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const contents = await file.text();
        console.log('File content:', contents);
    } catch (error) {
        console.error('Error importing file:', error);
    }
});

// Web Worker for background calculations
const calculateButton = document.getElementById('calculateButton');
const worker = new Worker('worker.js');

worker.onmessage = event => {
    console.log('Worker returned:', event.data);
};

calculateButton.addEventListener('click', () => {
    worker.postMessage(10);
});
