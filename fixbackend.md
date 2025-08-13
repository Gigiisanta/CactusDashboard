ASSUMPTION: El “pantallazo blanco” persiste por un error 500 en el endpoint proxy de AUM del dashboard. La raíz es que el backend no implementa `GET /api/v1/dashboard/aum-history`, y los componentes del dashboard esperan ese recurso.

### PROMPT DETALLADO (Opción B: fix backend permanente)

**Objetivo**
- Implementar de forma robusta y permanente el endpoint `GET /api/v1/dashboard/aum-history?days=30` en el backend (FastAPI), devolver una serie temporal de AUM agregada por día para los últimos N días, y asegurar tolerancia a datos vacíos.
- Mantener compatibilidad con el frontend actual que ya llama a `/api/v1/dashboard/aum-history`.

**Contexto actual observado**
- Frontend llama a `/api/v1/dashboard/aum-history` vía proxy y hoy recibe 500 con detail: "Failed to get AUM history: 'DashboardService' object has no attribute 'get_aum_history'".
- El frontend ya tiene `DashboardService.getAumHistory(days)` y lo invoca a través de `apiClientInterceptor.get('/dashboard/aum-history?days=...')`.
- El backend define modelos con SQLModel: `Portfolio`, `PortfolioSnapshot` (valor histórico), `Position`, etc., y ya expone `/dashboard/summary`.

**Requerimientos funcionales**
- Nuevo endpoint: `GET /api/v1/dashboard/aum-history`
  - Query param: `days` (int, 1–365, default 30), valida rango y responde 422 si inválido.
  - Respuesta: JSON array de puntos `{ date: 'YYYY-MM-DD', value: number }` en orden ascendente por fecha.
  - Semántica: usar `PortfolioSnapshot` si hay datos; si no hay snapshots para el rango, devolver `[]` (no error).
  - Zona horaria: normalizar a UTC, agrupar por fecha UTC del campo `timestamp`.
  - Performance: una sola query agregada (SUM por día), index friendly (usar índices existentes `ix_portfolio_snapshots_timestamp`).
  - Seguridad: requiere autenticación previa (mismo mecanismo que otros endpoints del dashboard).

**Diseño técnico (backend)**
- Crear esquema de respuesta:
  - Archivo: `cactus-wealth-backend/src/cactus_wealth/schemas.py` o un módulo cercano
  - Pydantic model:
    - `class AUMDataPoint(BaseModel): date: date; value: Decimal | float`
- Repositorio/servicio:
  - Archivo: `cactus-wealth-backend/src/cactus_wealth/services/dashboard_service.py`
  - Método: `get_aum_history(session: Session, days: int) -> list[AUMDataPoint]`
    - Rango: `since = utcnow() - timedelta(days=days-1)` hasta `utcnow()`
    - Query con SQLAlchemy/SQLModel sobre `PortfolioSnapshot`:
      - SELECT date_trunc('day', timestamp) AS day, SUM(value) AS total
      - WHERE timestamp >= :since
      - GROUP BY day
      - ORDER BY day ASC
    - Mapear a lista de AUMDataPoint (usar `.date()` en la fecha truncada)
- Ruta API:
  - Archivo: `cactus-wealth-backend/src/cactus_wealth/api/v1/endpoints/dashboard.py` (si no existe, créalo; si existe, extiéndelo)
  - `@router.get("/dashboard/aum-history", response_model=list[AUMDataPoint])`
    - Validar `days` dentro de [1, 365], default 30
    - Inyectar `Session` via `Depends(get_session)`
    - Llamar a `dashboard_service.get_aum_history(session, days)`
    - Retornar lista
- Registro del router:
  - Archivo: `cactus-wealth-backend/src/cactus_wealth/api/v1/api.py`
  - Incluir `dashboard` router si no está.

**Tolerancia a datos vacíos**
- Si no existen snapshots para el rango, retornar `[]` (no 404/500).
- Esto evita que el frontend quede en “loading” o se rompa.

**Pruebas (backend)**
- Unit tests (pytest):
  - Archivo: `cactus-wealth-backend/tests/api/v1/test_dashboard_aum_history.py`
  - Casos:
    - default: sin snapshots → 200 y `[]`
    - con snapshots en varios días → 200 y puntos ordenados, suma correcta
    - `days` fuera de rango (0, 366) → 422
- Integration (opcional): sembrar 2–3 `PortfolioSnapshot` en SQLite o PG y validar respuesta.

**Contratos del frontend (verificación)**
- No se requieren cambios de contrato; el frontend ya llama `GET /dashboard/aum-history?days=30`.
- Como mejora de resiliencia (opcional), en componentes que consumen AUM: si el array es `[]`, renderizar placeholder en lugar de “loader infinito”.

**Riesgos y mitigaciones**
- Si `PortfolioSnapshot` está vacío habitualmente, el gráfico se verá vacío: decisión de producto aceptar `[]` por ahora. Futuro: endpoint podría retornar baseline o replicar últimos valores.
- Precisión Decimal: convertir a `float` en respuesta para JSON si lo prefieres; o usar `Decimal` y `json_encoders` de Pydantic si habilitado. Recomendado: `float`.

**Criterios de aceptación**
- `curl -s http://localhost:8000/api/v1/dashboard/aum-history | jq` => `[]` (sin datos) o serie válida
- `curl -s 'http://localhost:8000/api/v1/dashboard/aum-history?days=10'` => 200 JSON, 0–10 puntos
- Frontend carga el dashboard sin pantallazo blanco; no hay 500 en `/api/v1/dashboard/aum-history`.

**Plan de trabajo (checklist ≤8)**
- [ ] Crear `AUMDataPoint` en schemas
- [ ] Implementar `get_aum_history` en `dashboard_service.py`
- [ ] Exponer `GET /dashboard/aum-history` en `endpoints/dashboard.py`
- [ ] Registrar el router en `api/v1/api.py`
- [ ] Añadir tests (unit + opcional integration)
- [ ] Ejecutar linters y tests
- [ ] Verificar desde frontend (curl / proxy y página dashboard)
- [ ] Commit convencional

**Differences (edits sugeridos, estilo mínimo)**
- `src/cactus_wealth/schemas.py` (o crear `schemas/dashboard.py`)
```python
from datetime import date
from pydantic import BaseModel

class AUMDataPoint(BaseModel):
    date: date
    value: float
```

- `src/cactus_wealth/services/dashboard_service.py`
```python
from datetime import datetime, timedelta, timezone
from sqlmodel import Session
from sqlalchemy import func
from ..models import PortfolioSnapshot
from ..schemas import AUMDataPoint

def get_aum_history(session: Session, days: int) -> list[AUMDataPoint]:
    if days < 1 or days > 365:
        raise ValueError("days must be between 1 and 365")
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days - 1)
    q = (
        session.query(
            func.date_trunc('day', PortfolioSnapshot.timestamp).label('day'),
            func.sum(PortfolioSnapshot.value).label('total'),
        )
        .filter(PortfolioSnapshot.timestamp >= since)
        .group_by(func.date_trunc('day', PortfolioSnapshot.timestamp))
        .order_by(func.date_trunc('day', PortfolioSnapshot.timestamp).asc())
    )
    rows = q.all()
    return [AUMDataPoint(date=r.day.date(), value=float(r.total)) for r in rows]
```

- `src/cactus_wealth/api/v1/endpoints/dashboard.py`
```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session
from ....database import get_session
from ....schemas import AUMDataPoint
from ....services.dashboard_service import get_aum_history

router = APIRouter()

@router.get("/dashboard/aum-history", response_model=list[AUMDataPoint])
def aum_history(
    days: int = Query(30, ge=1, le=365),
    session: Session = Depends(get_session),
):
    try:
        return get_aum_history(session, days)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
```

- `src/cactus_wealth/api/v1/api.py` (asegurar include)
```python
from .endpoints import dashboard  # add import
api_router.include_router(dashboard.router, prefix="", tags=["dashboard"])
```

**Tests (ejemplos mínimos)**
- `tests/api/v1/test_dashboard_aum_history.py`
```python
def test_aum_history_empty(client):
    res = client.get("/api/v1/dashboard/aum-history")
    assert res.status_code == 200
    assert res.json() == []

def test_aum_history_days_out_of_range(client):
    res = client.get("/api/v1/dashboard/aum-history?days=0")
    assert res.status_code == 422
```

**VERIFY (comandos)**
```bash
# Backend lint/type/test
cd cactus-wealth-backend
poetry install --no-root
poetry run ruff check src tests --fix
poetry run pytest -q

# Levantar stack (raíz del repo)
task --silent dev

# Probar endpoint (vía proxy frontend)
curl -s http://localhost:3000/api/v1/dashboard/aum-history | jq
```

**Commit**
- Conventional Commit:
  - feat(backend): add dashboard AUM history endpoint and schemas with aggregated time series
- Release note:
  - Dashboard AUM history API implemented; fixes blank dashboard by removing 500 on aum-history.


