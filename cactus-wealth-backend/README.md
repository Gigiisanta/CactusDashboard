# Cactus Wealth Backend

Backend API for the Cactus Wealth Dashboard - A financial advisor platform designed to streamline administrative tasks and enhance client recommendations.

## Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **SQLModel** - SQL databases in Python, designed by the creator of FastAPI
- **Pydantic Settings** - Settings management using environment variables
- **Python 3.11+** - Latest Python features and performance improvements

## Quick Start

1. Install dependencies using Poetry:
   ```bash
   poetry install
   ```

2. Activate the virtual environment:
   ```bash
   poetry shell
   ```

3. Run the development server:
   ```bash
   python main.py
   ```

4. Visit http://localhost:8000/docs for the interactive API documentation.

## Smoke testing (SQLite)

To run a lightweight smoke suite against SQLite (no external services), use:

```bash
PYTEST_SMOKE=1 PYTHONPATH=src poetry run pytest -q tests/test_health_endpoint.py tests/test_passkeys.py
```

Notes:
- The tests will create a temporary SQLite DB file and drop/recreate tables idempotently.
- JWT in tests uses a deterministic fallback secret to avoid env coupling.
- Health endpoint `/health` should always return 200 in < 1s.

## Lint and Types

```bash
poetry run ruff check src tests --fix
poetry run mypy src/cactus_wealth/services/webauthn_service.py \
  src/cactus_wealth/services/investment_account_service.py \
  src/cactus_wealth/services/insurance_policy_service.py
```

## API Endpoints

- `GET /api/v1/health` - Health check endpoint

## Project Structure

```
cactus-wealth-backend/
├── src/
│   └── cactus_wealth/
│       ├── api/
│       │   └── v1/
│       │       ├── endpoints/
│       │       └── api.py
│       └── core/
│           └── config.py
├── main.py
└── pyproject.toml
``` 