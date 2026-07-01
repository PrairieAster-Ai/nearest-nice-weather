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

- **`scripts/dev-start.mjs` `spawn(command, {shell:true})` (semgrep `spawn-shell-true`, CWE-78).** Auto-dismissed as FP by /security-audit: `command` is only ever a static literal (`'node dev-api-server.js'`, `'npm run dev'`) — no attacker input; `shell:true` is deliberate (Windows `npm.cmd` resolution). Env-derived ports are `Number()`-coerced; Windows pids are `/^\d+$/`-validated. Trusted local dev tool (exclusions #20/#24). Do not re-raise unless a callsite starts passing user/network-controlled `command`/`cwd`.
- **`scripts/dev-onboarding/scripts/doctor.mjs:78` `new RegExp()` (semgrep `detect-non-literal-regexp`, ReDoS).** Hard exclusion #14 (ReDoS) + interpolated key comes from developer-controlled config, not attacker input. Dismissed.
- **`dev-start.mjs` `--clean` clears `apps/web/.parcel-cache`+`dist` but not Vite's `node_modules/.vite`.** Verbatim port of the retired `dev-startup-optimized.sh` clean logic — behavior-preserving parity, NOT a regression. Low value; only raise if a stale-Vite-cache incident actually occurs.
  - **How to apply:** these three are noise-suppression records — skip them on future sweeps of this code unless the surrounding logic changes.
