// app/js/ingest/csv_parser.js

export function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        return []; // Not enough data, needs at least a header and a row
    }

    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines

        const values = lines[i].split(',');
        if (values.length !== headers.length) {
            console.warn(`Skipping line ${i + 1}: mismatched number of columns.`);
            continue;
        }

        const entry = {};
        for (let j = 0; j < headers.length; j++) {
            entry[headers[j].trim()] = values[j].trim();
        }
        data.push(entry);
    }

    return data;
}
