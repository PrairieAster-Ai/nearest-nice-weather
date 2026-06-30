#!/bin/bash
# Dev environment setup for Nearest Nice Weather.
# This script now delegates to the dev-onboarding skill's idempotent bootstrap
# (config: dev-onboarding.config.json). The previous hand-maintained version had
# drifted (referenced local Postgres/Redis/Python that this project no longer uses).
# Prefer: npm run bootstrap   ·   diagnose with: npm run doctor
exec node "$(dirname "$0")/../.claude/skills/dev-onboarding/scripts/bootstrap.mjs" "$@"
