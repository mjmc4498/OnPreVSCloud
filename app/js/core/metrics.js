// app/js/core/metrics.js

/**
 * Calculates the Cost Per Transaction (CPT).
 * This is a simple lookup from the pre-calculated map.
 * @param {string} txId The ID of the transaction.
 * @param {Map<string, number>} allocatedTxCosts A map of txId -> totalCost.
 * @returns {number} The total cost of the transaction.
 */
export function calcCPT(txId, allocatedTxCosts) {
  return allocatedTxCosts.get(txId) || 0;
}

/**
 * Calculates the total ghost cost (unallocated cost) for a period.
 * @param {Array<object>} ghostCostsData An array of unallocated cost objects.
 * @returns {number} The sum of all unallocated costs.
 */
export function ghostCost(ghostCostsData) {
  if (!ghostCostsData) return 0;
  return ghostCostsData.reduce((sum, cost) => sum + cost.costUSD, 0);
}

/**
 * Compares the total cost of on-prem vs. cloud resources for a given dataset.
 * Note: This is a simplified version. A real implementation would need to handle
 * costs that are already allocated to transactions and link them back to resources.
 * This version just sums the raw costs of resources based on their 'env' tag.
 * @param {Array<object>} costs - Array of all cost objects.
 * @param {Map<string, object>} resourcesMap - Map of resourceId to resource object.
 * @returns {object} An object with onpremUSD, cloudUSD, deltaUSD, and deltaPct.
 */
export function compareOnPremCloud(costs, resourcesMap) {
  let onpremUSD = 0;
  let cloudUSD = 0;

  costs.forEach((cost) => {
    const resource = resourcesMap.get(cost.resourceId);
    if (resource) {
      if (resource.env === "onprem") {
        onpremUSD += cost.costUSD;
      } else if (resource.env === "cloud") {
        cloudUSD += cost.costUSD;
      }
    }
  });

  const deltaUSD = cloudUSD - onpremUSD;
  const deltaPct =
    onpremUSD > 0 ? (deltaUSD / onpremUSD) * 100 : cloudUSD > 0 ? Infinity : 0;

  return { onpremUSD, cloudUSD, deltaUSD, deltaPct };
}

/**
 * Calculates the cost split by phase ('antes', 'durante', 'después') for a single transaction.
 * @param {string} txId The ID of the transaction.
 * @param {Array<object>} spans All span objects.
 * @param {Map<string, number>} allocatedSpanCosts A map of spanId -> allocatedCost.
 * @param {Map<string, object>} transactionsMap A map of txId -> transaction object.
 * @returns {object} An object like { antes: cost, durante: cost, después: cost }.
 */
export function phaseSplit(txId, spans, allocatedSpanCosts, transactionsMap) {
  const split = { antes: 0, durante: 0, después: 0 };
  const transaction = transactionsMap.get(txId);
  if (!transaction) return split;

  // This is a simplified model where all spans in a transaction are assigned the transaction's phase.
  const phase = transaction.phase;

  let totalCost = 0;
  spans.forEach((span) => {
    if (span.txId === txId && allocatedSpanCosts.has(span.spanId)) {
      totalCost += allocatedSpanCosts.get(span.spanId);
    }
  });

  if (split.hasOwnProperty(phase)) {
    split[phase] = totalCost;
  }

  return split;
}
