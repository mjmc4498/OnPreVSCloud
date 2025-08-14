/**
 * A robust CSV parser that handles quoted fields containing commas and empty fields.
 * This implementation uses a simple state machine to iterate through the string.
 * @param {string} csvText The raw CSV text.
 * @returns {Array<object>} An array of objects representing the CSV rows.
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return []; // Not enough data
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const values = parseCsvLine(lines[i]);

    if (values.length !== headers.length) {
      console.warn(
        `Skipping line ${i + 1}: Mismatched number of columns. Expected ${
          headers.length
        }, got ${values.length}. Line: "${lines[i]}"`,
      );
      continue;
    }

    const entry = {};
    for (let j = 0; j < headers.length; j++) {
      entry[headers[j]] = values[j];
    }
    data.push(entry);
  }

  return data;
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // If the next character is also a quote, it's an escaped quote
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}
