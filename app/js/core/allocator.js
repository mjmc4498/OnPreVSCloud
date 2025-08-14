// app/js/core/allocator.js
import { getAll } from '../db/indexeddb.js';
import { getRules } from './rules.js';

async function fetchAllData() {
  console.log('Fetching all data for allocation...');
  const [transactions, spans, resources, costs, rules] = await Promise.all([
    getAll('transactions'),
    getAll('spans'),
    getAll('resources'),
    getAll('costs'),
    getRules(),
  ]);
  const data = { transactions, spans, resources, costs, rules };
  console.log('Data fetched.');
  return data;
}

function linkSpanToResource(span, resourcesMap) {
  const resourceIdFromAttr = span.attrs['cloud.resource_id'];
  if (resourceIdFromAttr && resourcesMap.has(resourceIdFromAttr)) {
    return resourceIdFromAttr;
  }
  if (span.attrs['resource.tag.*']) {
    console.warn(
      'Tag intersection logic for linking spans to resources is not yet implemented.',
    );
  }
  return null;
}

/**
 * Allocates costs for a single period (e.g., '2025-06').
 * @param {string} period - The period to process.
 * @param {Array} allSpans - All span objects.
 * @param {Array} allCosts - All cost objects.
 * @param {Map<string, object>} resourcesMap - Map of resourceId to resource object.
 * @returns {Map<string, number>} A map of spanId -> allocatedCost for the given period.
 */
function allocateByTraceForPeriod(period, allSpans, allCosts, resourcesMap) {
  const allocatedCosts = new Map();
  const resourceUsage = new Map();

  const periodCosts = allCosts.filter(c => c.period === period);
  const periodSpans = allSpans.filter(span => {
    const spanDate = new Date(span.start);
    const spanPeriod = `${spanDate.getFullYear()}-${String(
      spanDate.getMonth() + 1,
    ).padStart(2, '0')}`;
    return spanPeriod === period;
  });

  periodSpans.forEach(span => {
    const resourceId = linkSpanToResource(span, resourcesMap);
    if (!resourceId) return;
    const duration = span.end - span.start;
    if (duration <= 0) return;
    if (!resourceUsage.has(resourceId)) {
      resourceUsage.set(resourceId, { totalDuration: 0, cost: 0, costPerMs: 0 });
    }
    resourceUsage.get(resourceId).totalDuration += duration;
  });

  periodCosts.forEach(cost => {
    if (resourceUsage.has(cost.resourceId)) {
      resourceUsage.get(cost.resourceId).cost += cost.costUSD;
    }
  });

  resourceUsage.forEach(usage => {
    if (usage.totalDuration > 0) {
      usage.costPerMs = usage.cost / usage.totalDuration;
    }
  });

  periodSpans.forEach(span => {
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

// Placeholder strategies
function allocateByUsage(spans, costs, resourcesMap) {
  console.warn("Allocation 'by usage' is not yet implemented.");
  return new Map();
}
function allocateByWeight(spans, costs, resourcesMap) {
  console.warn("Allocation 'by weight' is not yet implemented.");
  return new Map();
}

const allocationStrategies = {
  spans: allocateByTraceForPeriod,
  usage: allocateByUsage,
  weight: allocateByWeight,
  fixed: allocateByWeight,
};

export async function runAllocation() {
  console.log('Cost allocation engine started...');
  const { transactions, spans, resources, costs, rules } = await fetchAllData();
  const resourcesMap = new Map(resources.map(r => [r.resourceId, r]));

  const allAllocatedSpanCosts = new Map();
  const unallocatedCosts = [...costs]; // This logic needs to be improved later

  const periods = [...new Set(costs.map(c => c.period))];

  for (const period of periods) {
    // In a real implementation, rules would be applied here to select the strategy.
    // For now, we default to 'spans' (by trace).
    const strategyFn = allocationStrategies.spans;
    const newlyAllocated = strategyFn(period, spans, costs, resourcesMap);
    newlyAllocated.forEach((cost, id) => allAllocatedSpanCosts.set(id, cost));
  }

  const allocatedTxCosts = new Map();
  spans.forEach(span => {
    if (allAllocatedSpanCosts.has(span.spanId)) {
      const spanCost = allAllocatedSpanCosts.get(span.spanId);
      const currentTxCost = allocatedTxCosts.get(span.txId) || 0;
      allocatedTxCosts.set(span.txId, currentTxCost + spanCost);
    }
  });

  console.log('Final Allocated Span Costs:', allAllocatedSpanCosts);
  console.log('Final Allocated Transaction Costs:', allocatedTxCosts);

  const ghostCosts = unallocatedCosts.filter(c => true); // Placeholder
  console.log('Ghost Costs (unallocated):', ghostCosts);

  console.log('Cost allocation engine finished.');
  return {
    allocatedSpanCosts: allAllocatedSpanCosts,
    allocatedTxCosts,
    ghostCosts,
  };
}
