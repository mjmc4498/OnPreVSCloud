import { initDB, getAll } from "./db/indexeddb.js";
import { loadSampleData } from "./ingest/loader.js";
import { runAllocation } from "./core/allocator.js";
import * as metrics from "./core/metrics.js";

async function main() {
  // Initialize the database
  try {
    await initDB();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return; // Stop execution if DB fails to initialize
  }

  // Register Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("app/sw.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope,
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  }

  // --- UI Event Listeners ---

  // Button to load sample data
  const loadSampleDataButton = document.getElementById("loadSampleDataButton");
  if (loadSampleDataButton) {
    loadSampleDataButton.addEventListener("click", () => {
      loadSampleData();
    });
  }

  // Button to run the allocation engine
  const runAllocationButton = document.getElementById("runAllocationButton");
  if (runAllocationButton) {
    runAllocationButton.addEventListener("click", async () => {
      console.log("--- Running Allocation & Metrics ---");
      const { allocatedSpanCosts, allocatedTxCosts, ghostCosts } =
        await runAllocation();

      // To run metrics, we need the raw data again. This is inefficient for production
      // but fine for this verification step. A real app would manage this data in a state store.
      const [transactions, spans, resources, costs] = await Promise.all([
        getAll("transactions"),
        getAll("spans"),
        getAll("resources"),
        getAll("costs"),
      ]);
      const resourcesMap = new Map(resources.map((r) => [r.resourceId, r]));
      const transactionsMap = new Map(transactions.map((t) => [t.txId, t]));

      // --- Verify Metric Functions ---

      // 1. CPT for the first transaction
      if (transactions.length > 0) {
        const firstTxId = transactions[0].txId;
        const cpt = metrics.calcCPT(firstTxId, allocatedTxCosts);
        console.log(`Metric: CPT for txId ${firstTxId}:`, cpt);
      }

      // 2. Total Ghost Cost
      const totalGhostCost = metrics.ghostCost(ghostCosts);
      console.log("Metric: Total Ghost Cost:", totalGhostCost);

      // 3. On-prem vs Cloud
      const comparison = metrics.compareOnPremCloud(costs, resourcesMap);
      console.log("Metric: On-prem vs Cloud Comparison:", comparison);

      // 4. Phase Split for the first transaction
      if (transactions.length > 0) {
        const firstTxId = transactions[0].txId;
        const split = metrics.phaseSplit(
          firstTxId,
          spans,
          allocatedSpanCosts,
          transactionsMap,
        );
        console.log(`Metric: Phase Split for txId ${firstTxId}:`, split);
      }
      console.log("--- Finished Running Metrics ---");
    });
  }

  // Button to import a custom file
  const importButton = document.getElementById("importButton");
  if (importButton) {
    importButton.addEventListener("click", async () => {
      try {
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const contents = await file.text();
        console.log("File content:", contents);
        // Here, you would call parsers and saveData functions
      } catch (error) {
        console.error("Error importing file:", error);
      }
    });
  }

  // Button for background calculations
  const calculateButton = document.getElementById("calculateButton");
  const worker = new Worker("app/js/workers/aggs.worker.js", {
    type: "module",
  });

  worker.onmessage = (event) => {
    console.log("Worker returned:", event.data);
  };

  if (calculateButton) {
    calculateButton.addEventListener("click", () => {
      worker.postMessage(10);
    });
  }
}

main();
