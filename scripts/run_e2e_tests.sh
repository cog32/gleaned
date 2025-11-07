#!/usr/bin/env bash
set -euo pipefail

echo "Running E2E tests (Playwright, one-shot)…"

if ! node -e "require.resolve('@playwright/test')" >/dev/null 2>&1; then
  echo "@playwright/test is not installed. Install it with:"
  echo "  npm i -D @playwright/test"
  exit 1
fi

npx playwright test --config=playwright.config.ts
