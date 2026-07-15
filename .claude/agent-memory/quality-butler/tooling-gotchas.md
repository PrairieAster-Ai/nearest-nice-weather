---
name: tooling-gotchas
description: Composed-skill availability and wiki-stamp marker prefixes for the quality-butler in this repo
metadata:
  type: reference
---

Butler tooling specifics for nearest-nice-weather:

- **`/security-audit` IS installed** (vendored in #329 on 2026-06-30: `.claude/skills/security-audit/{SKILL.md,README.md}`, ~61 KB). It is the **primary** security tool for the sweep — run it on the diff window; do NOT fall back to manual grepping while it's available. `security-review` (bundled) only targets *pending* uncommitted changes, so it's useless on a clean post-merge tree; `owasp-security` is reference knowledge only. Repo hotspots to confirm the audit covers: HTML/popup builders (`buildPoiPopupHtml` in `apps/web/src/utils/mapPopup.ts`) and `npm audit` advisories (mirrored in `code-health/security-history.tsv`). Fallback **only if the skill genuinely can't run**: grep added lines for sinks (`innerHTML`, `dangerouslySetInnerHTML`, `eval`, `http://`, secrets/tokens).
  - *Corrected 2026-07-01: this note previously claimed the skill was "NOT installed" — that was written 06-30 14:19, hours before #329 vendored it. Verify skill availability at run start (see the agent's "Re-validate before you rely on memory" step) so a stale note never downgrades the security pass again.*

- **Wiki stamp marker prefixes differ per page:** Code-Health-Dashboard.md uses `<!--ch:*-->` (stamped by `stamp-codehealth.mjs`); Quality-Coverage.md uses `<!--ql:*-->` (stamped by `quality-checklist.mjs --stamp`). Do NOT guard Quality-Coverage with `qc:` — that false-positives as "hand-authored". Use `ql:`.

- **Green-gate for this repo:** `npm run lint:web && npm run type-check && (cd apps/web && npx vitest run)` plus `npm run lint:circular` and `npm run docs:gate`. The `AdManager.test.tsx` "useAdManager must be used within AdManagerProvider" console.error is an intentional error-path test, not a failure.

- **Wiki push works over SSH** in this environment (`git@github.com:PrairieAster-Ai/nearest-nice-weather.wiki.git`). Clone to a temp dir, stamp, push, then remove the temp dir.
