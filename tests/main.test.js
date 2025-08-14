import { describe, it, expect, vi, beforeAll } from "vitest";
import { runAllocation } from "../app/js/core/allocator.js";
import * as metrics from "../app/js/core/metrics.js";
import { parseCSV } from "../app/js/ingest/csv_parser.js";
import fs from "fs";
import path from "path";

// Mock the database modules
vi.mock("../app/js/db/indexeddb.js");
vi.mock("../app/js/core/rules.js");

import { getAll } from "../app/js/db/indexeddb.js";
import { getRules } from "../app/js/core/rules.js";

// --- Test Data Loading ---
let testData;

beforeAll(() => {
  const resourcesCSV = fs.readFileSync(
    path.resolve(__dirname, "../app/sample-data/resources.csv"),
    "utf-8",
  );
  const costsCSV = fs.readFileSync(
    path.resolve(__dirname, "../app/sample-data/costs.csv"),
    "utf-8",
  );
  const transactions = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "../app/sample-data/transactions.json"),
      "utf-8",
    ),
  );
  const spans = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "../app/sample-data/spans.json"),
      "utf-8",
    ),
  );

  const resources = parseCSV(resourcesCSV);
  const costs = parseCSV(costsCSV).map((c) => ({
    ...c,
    costUSD: parseFloat(c.costUSD) || 0,
  }));

  testData = { transactions, spans, resources, costs, rules: [] };

  // Configure the mock implementations
  getAll.mockImplementation((storeName) =>
    Promise.resolve(testData[storeName] || []),
  );
  getRules.mockResolvedValue([]);
});

// --- Test Suites ---
describe("Cost Allocation Engine", () => {
  it("should allocate costs and return results as Maps", async () => {
    const { allocatedTxCosts, allocatedSpanCosts } = await runAllocation();
    expect(allocatedTxCosts).toBeInstanceOf(Map);
    expect(allocatedSpanCosts).toBeInstanceOf(Map);
  });

  it("should calculate a positive cost for a transaction", async () => {
    const { allocatedTxCosts } = await runAllocation();
    const tx2Cost = allocatedTxCosts.get("TX-002");
    expect(tx2Cost).toBeGreaterThan(0);
  });
});

describe("Metrics Module", () => {
  it("calcCPT should return the correct cost for a transaction", async () => {
    const { allocatedTxCosts } = await runAllocation();
    const tx2Cost = allocatedTxCosts.get("TX-002");
    const cpt = metrics.calcCPT("TX-002", allocatedTxCosts);
    expect(cpt).toEqual(tx2Cost);
  });

  it("compareOnPremCloud should correctly sum costs for a period", () => {
    // This test requires filtering costs by period, which the sample data has.
    // Let's test for June 2025.
    const juneCosts = testData.costs.filter((c) => c.period === "2025-06");
    const resourcesMap = new Map(
      testData.resources.map((r) => [r.resourceId, r]),
    );

    const { onpremUSD, cloudUSD } = metrics.compareOnPremCloud(
      juneCosts,
      resourcesMap,
    );

    expect(onpremUSD).toBeCloseTo(1500);
    expect(cloudUSD).toBeCloseTo(225);
  });
});
