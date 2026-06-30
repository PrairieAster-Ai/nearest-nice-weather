# steward-state

Durable state for the **quality-steward** weekly sweep. Not a code branch — do not merge.

- `last-sweep-sha` — the HEAD the last successful sweep ran against; the next sweep diffs `<sha>...HEAD`.
- `code-health/*-history.tsv` + `*.json` — the accumulated CodeHealth trend, restored before each
  sweep and persisted after, so the dashboard is a real trend line across ephemeral CI runners.

Written by `.github/workflows/quality-steward.yml` (the "Resolve sweep range" + "Persist sweep marker" steps).
