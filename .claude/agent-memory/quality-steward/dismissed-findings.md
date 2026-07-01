---
name: dismissed-findings
description: Findings the steward deliberately did NOT raise as GitHub issues — do not re-raise unless impact changes
metadata:
  type: project
---

Findings observed during sweeps but intentionally not raised as issues (to avoid noise):

- **`usePoiMarkers.ts` incremental marker reuse keys only on lat/lng, not POI id.** If `locations[index]` is replaced by a *different* POI sharing identical coordinates, the reused marker's `popupopen` closure still reports the original POI to `trackPOIInteraction` (stale analytics). Pre-existing logic carried verbatim from MapContainer during the #324 extraction; near-zero probability in the MN POI dataset (distinct POIs rarely share exact lat/lng). Low severity.
  - **Why not raised:** maintainer is focused on B2C feature work (per CLAUDE.md); a near-impossible analytics edge case would be issue-tracker noise.
  - **How to apply:** only escalate if POI ingestion starts producing coincident coordinates, or if marker reuse is changed to also vary popup/analytics state.
