// app/js/core/allocator.js
import { getAll } from '../db/indexeddb.js';
import { getRules } from './rules.js';

/**
 * Fetches all the data required for the allocation engine from IndexedDB.
 * @returns {Promise<object>} A promise that resolves to an object containing all the data.
 */
async function fetchAllData() {
    console.log('Fetching all data for allocation...');
    const [transactions, spans, resources, costs, rules] = await Promise.all([
        getAll('transactions'),
        getAll('spans'),
        getAll('resources'),
        getAll('costs'),
        getRules()
    ]);
    const data = { transactions, spans, resources, costs, rules };
    console.log('Data fetched:', data);
    return data;
}

/**
 * Links a span to a specific resource based on its attributes.
 * @param {object} span The span object.
 * @param {Map<string, object>} resourcesMap A map of resourceId to resource object for efficient lookup.
 * @returns {string|null} The ID of the matched resource, or null if no match.
 */
function linkSpanToResource(span, resourcesMap) {
    const resourceIdFromAttr = span.attrs['cloud.resource_id'];
    if (resourceIdFromAttr && resourcesMap.has(resourceIdFromAttr)) {
        return resourceIdFromAttr;
    }
    if (span.attrs['resource.tag.*']) {
        console.warn('Tag intersection logic for linking spans to resources is not yet implemented.');
    }
    return null;
}

/**
 * Allocates costs to spans based on the duration of the span relative
 * to the total duration of all spans hitting a specific resource in a given period.
 * @param {Array} spans - Array of span objects.
 * @param {Array} costs - Array of cost objects.
 * @param {Map<string, object>} resourcesMap - Map of resourceId to resource object.
 * @returns {Map<string, number>} A map of spanId -> allocatedCost.
 */
function allocateByTrace(spans, costs, resourcesMap) {
    const allocatedCosts = new Map();
    const resourceUsage = new Map(); // resourceId -> { totalDuration: number, cost: number, costPerMs: number }

    // 1. Link spans to resources and aggregate total duration per resource
    spans.forEach(span => {
        const resourceId = linkSpanToResource(span, resourcesMap);
        if (!resourceId) return;

        const duration = span.end - span.start;
        if (duration <= 0) return;

        if (!resourceUsage.has(resourceId)) {
            resourceUsage.set(resourceId, { totalDuration: 0, cost: 0, costPerMs: 0 });
        }
        resourceUsage.get(resourceId).totalDuration += duration;
    });

    // 2. Get the total cost for each resource for the period
    // This is simplified: it assumes one cost entry per resource for the relevant period.
    costs.forEach(cost => {
        if (resourceUsage.has(cost.resourceId)) {
            resourceUsage.get(cost.resourceId).cost += cost.costUSD;
        }
    });

    // 3. Calculate cost per millisecond for each resource
    resourceUsage.forEach((usage, resourceId) => {
        if (usage.totalDuration > 0) {
            usage.costPerMs = usage.cost / usage.totalDuration;
        }
    });

    // 4. Calculate and allocate cost for each individual span
    spans.forEach(span => {
        const resourceId = linkSpanToResource(span, resourcesMap);
        if (!resourceId || !resourceUsage.has(resourceId)) return;

        const usage = resourceUsage.get(resourceId);
        if (usage.costPerMs > 0) {
            const duration = span.end - span.start;
            const spanCost = duration * usage.costPerMs;
            allocatedCosts.set(span.spanId, spanCost);
        }
    });

    return allocatedCosts;
}

function allocateByUsage(spans, costs, resourcesMap) {
    console.warn("Allocation 'by usage' is not yet implemented.");
    return new Map();
}

function allocateByWeight(spans, costs, resourcesMap) {
    console.warn("Allocation 'by weight' is not yet implemented.");
    return new Map();
}

const allocationStrategies = {
    spans: allocateByTrace,
    usage: allocateByUsage,
    weight: allocateByWeight,
    fixed: allocateByWeight, // 'fixed' can be a form of 'weight'
};

/**
 * The main entry point for the cost allocation engine.
 */
export async function runAllocation() {
    console.log("Cost allocation engine started...");
    const { transactions, spans, resources, costs, rules } = await fetchAllData();
    const resourcesMap = new Map(resources.map(r => [r.resourceId, r]));

    let allocatedSpanCosts = new Map();
    let unallocatedCosts = [...costs];

    // This is a simplified rule-processing loop. A real implementation would be more complex,
    // filtering the data based on `rule.match` criteria before passing it to the strategy.
    for (const rule of rules) {
        const strategyFn = allocationStrategies[rule.allocate.by];
        if (strategyFn) {
            console.log(`Applying rule '${rule.name}' with strategy '${rule.allocate.by}'...`);

            // This is a placeholder for the complex logic of filtering data based on the rule.
            // For now, we pass all data to the first rule's strategy.
            const newlyAllocated = strategyFn(spans, unallocatedCosts, resourcesMap);

            // Merge newly allocated costs
            newlyAllocated.forEach((cost, id) => allocatedSpanCosts.set(id, cost));

            // A real implementation would need to track which costs are now accounted for
            // and remove them from `unallocatedCosts`. This is non-trivial.
            // For this placeholder, we'll just run the first strategy and stop.
            break;
        }
    }

    console.log("Final Allocated Span Costs:", allocatedSpanCosts);

    // Any costs left in `unallocatedCosts` could be considered "ghost costs".
    const ghostCosts = unallocatedCosts.filter(c => /* some logic to see if it was used */ true);
    console.log("Ghost Costs (unallocated):", ghostCosts);


    console.log("Cost allocation engine finished.");
    return { allocatedSpanCosts, ghostCosts };
}
