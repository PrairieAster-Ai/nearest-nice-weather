---
name: last-sweep-state
description: The last-sweep HEAD SHA and scope, so the next weekly sweep can compute its diff window
metadata:
  type: project
---

Last recorded local sweep ran 2026-06-30. Last-sweep HEAD = `4e24cfb` (PR #328, "refactor(map): simplify useMapPopupNavigation").

**Authoritative state is now the `steward-state` branch** (created 2026-06-30 by #329; `origin/steward-state`). In CI the workflow reads `last-sweep-sha` from that branch and passes the diff window in the instruction — trust it over this file. This memory is the **local/on-demand fallback only**, used when no window is passed and the branch isn't fetched.

**How to apply:** if given an explicit window, use it. Otherwise (local run) diff from `4e24cfb`. Trend deltas are repo-wide and independent of the window.

*Corrected 2026-07-01: this file previously said "there is no durable steward-state branch yet" — true when written 06-30 14:19, but #329 created it at 15:37 the same day.*

Sweep outcome (2026-06-30): window `2c982d7..4e24cfb` (24 merged PRs) was dominated by behavior-preserving refactors (extract-to-hooks/utils), test additions, TSDoc, dead-code removal, Dependabot bumps. Green-gate green (897 tests), both new gates pass, CodeHealth 92.7→94 (A), Documentation→100, fn>cc15 4→3. No correctness bugs, no security findings, no safe auto-fixes available (lint clean + 100% TSDoc), so no auto-fix PR and no issues raised. Refreshed Code-Health-Dashboard.md on the wiki; Quality-Coverage.md already current.

Note: re-running `npm run codehealth:report` appends a new dated row even on the same day, so `code-health/*.tsv` can hold duplicate same-date rows — harmless. On a **local** run these TSV/json files are left as uncommitted local mods (never pushed to `main`). In **CI** the workflow restores the trend from `steward-state` before the run and persists the updated trend back to `steward-state` after — so history accumulates there, not on `main`.
