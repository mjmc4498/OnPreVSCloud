// app/js/core/validators.js

/**
 * Validates that an object has the required keys.
 * @param {object} obj The object to validate.
 * @param {string[]} requiredKeys An array of required key names.
 * @returns {boolean} True if all required keys exist, false otherwise.
 */
function checkRequiredKeys(obj, requiredKeys) {
    for (const key of requiredKeys) {
        if (obj[key] === undefined || obj[key] === null) {
            console.error(`Validation Error: Missing required key '${key}' in object:`, obj);
            return false;
        }
    }
    return true;
}

// --- Specific Validators ---

export function validateTransaction(tx) {
    const required = ['txId', 'name', 'phase', 'timestamp'];
    if (!checkRequiredKeys(tx, required)) return false;

    const validPhases = ['antes', 'durante', 'después'];
    if (!validPhases.includes(tx.phase)) {
        console.error(`Validation Error: Invalid phase '${tx.phase}'`);
        return false;
    }
    return true;
}

export function validateResource(resource) {
    const required = ['resourceId', 'name', 'type', 'env', 'migrated', 'tags'];
    if (!checkRequiredKeys(resource, required)) return false;

    if (!Array.isArray(resource.tags)) {
        console.error(`Validation Error: 'tags' must be an array.`);
        return false;
    }

    // Basic validation for required tags (just checks if the tag key is present)
    const requiredTagKeys = [
        'env', 'provider', 'accountId', 'region', 'serviceName',
        'migration.phase', 'migration.batch', 'cost.center', 'owner.team', 'pii'
    ];
    const presentTagKeys = resource.tags.map(t => t.split(':')[0]);
    for (const key of requiredTagKeys) {
        if (!presentTagKeys.includes(key)) {
            // This is a soft validation for now, we can make it stricter later.
            // console.warn(`Validation Warning: Recommended tag '${key}' is missing from resource ${resource.resourceId}`);
        }
    }

    return true;
}

export function validateSpan(span) {
    const required = ['spanId', 'txId', 'serviceName', 'operation', 'start', 'end', 'attrs'];
    if (!checkRequiredKeys(span, required)) return false;

    if (!span.attrs['tx.id']) {
        console.warn("Validation Warning: Span attrs missing 'tx.id'");
    }

    return true;
}

export function validateCost(cost) {
    const required = ['resourceId', 'period', 'costUSD'];
    return checkRequiredKeys(cost, required);
}

export function validateMapping(mapping) {
    const required = ['id', 'name', 'match', 'allocate'];
    return checkRequiredKeys(mapping, required);
}
