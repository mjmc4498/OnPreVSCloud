# CostScope

## Pitch

CostScope is a cost observability system that compares on-prem vs. cloud costs across different migration phases (before, during, and after).

## MVP Scope

The Minimum Viable Product (MVP) will focus on the following:

- **Core Functionality:**
  - Calculate and display cost per transaction.
  - Link to OpenTelemetry-like traces.
  - Associate costs with migrated resource tags.
- **Technology Stack:**
  - **Frontend:** 100% in-browser Progressive Web App (PWA).
  - **Data Storage:** IndexedDB.
  - **Data Import/Export:** File System Access API.
  - **Computation:** Web Workers for background calculations.
- **Optional Backend:**
  - A Python microservice (using FastAPI) for heavy data aggregation and parsing CSV/JSON files.

## Long-Term Vision (2025)

Our goal for 2025 is to evolve CostScope into a comprehensive dashboard that unifies unit economics, FinOps, and observability in a single panel.
