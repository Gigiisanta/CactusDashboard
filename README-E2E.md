# E2E Testing Guide

## Local smoke

```bash
task --silent up:smoke
```

## Frontend-only

```bash
cd cactus-wealth-frontend
npx playwright install --with-deps
npm run -s e2e:smoke
npm run -s e2e:full
```

## Env vars
- BASE_URL: frontend base (default `http://localhost:3000`)
- BACKEND_URL: backend base (default `http://localhost:8000`)
- E2E_MODE=1 and E2E_SECRET: enable reset seed via `POST /api/v1/health/e2e/reset`
- PWTEST_SMOKE=1: skips reset in smoke runs

## Artifacts
- HTML: `cactus-wealth-frontend/playwright-report`
- JUnit/JSON: `cactus-wealth-frontend/test-results/`
- Traces/screenshots/videos on failures only

## Troubleshooting
- Ports busy: `task --silent cleanup:ports`
- Podman machine: `task --silent podman:ensure` then `task --silent dev`
- macOS Docker socket: install podman-mac-helper (see `docs/PODMAN.md`)


