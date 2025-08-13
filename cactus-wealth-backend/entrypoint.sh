#!/bin/sh
# =============================================================================
# 🌵 CACTUS WEALTH BACKEND - ULTRA-OPTIMIZED CONTAINER ENTRYPOINT
# =============================================================================
# Ultra-optimized entrypoint for fast Docker startup
# Version: 4.0.0 - SPEED FOCUSED
# =============================================================================

set -e

echo "🚀 Starting Cactus Wealth Backend (Ultra-Optimized Mode)..."

# Fast database connection check with shorter timeout
echo "🔍 Fast database connection check..."

DB_READY=0
i=1
while [ $i -le 15 ]; do
    if python -c "
import os
import psycopg2
from urllib.parse import urlparse

try:
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/cactus_dashboard')
    parsed = urlparse(db_url)
    conn = psycopg2.connect(
        host=parsed.hostname, 
        port=parsed.port or 5432, 
        database=parsed.path[1:], 
        user=parsed.username, 
        password=parsed.password, 
        connect_timeout=1
    )
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'⚠️ Database connection failed: {e}')
    raise SystemExit(1)
"; then
        DB_READY=1
        break
    else
        echo "⏳ Waiting for DB... ($i/15)"
        sleep 1
        i=$((i + 1))
    fi
done

if [ $DB_READY -eq 0 ]; then
    echo "❌ Database connection failed after 15 attempts"
    exit 1
fi

echo "✅ Database ready!"

# Run migrations if needed (fast mode)
echo "🔄 Checking migration state..."

# Decide whether to run upgrade or stamp based on current DB state
python - <<'PY'
import os
import psycopg2
from urllib.parse import urlparse

db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/cactus_wealth')
parsed = urlparse(db_url)
conn = psycopg2.connect(
    host=parsed.hostname,
    port=parsed.port or 5432,
    database=parsed.path[1:],
    user=parsed.username,
    password=parsed.password,
    connect_timeout=2,
)
conn.autocommit = True
cur = conn.cursor()

def exists(table: str) -> bool:
    cur.execute("SELECT to_regclass(%s)", (table,))
    return cur.fetchone()[0] is not None

has_alembic = exists('public.alembic_version') or exists('alembic_version')
has_users = exists('public.users') or exists('users')

print(f"alembic_version_exists={has_alembic} users_exists={has_users}")

# Expose decision to shell via a file flag
decision = 'upgrade'
if not has_alembic and has_users:
    # Existing schema but not tracked by Alembic → stamp instead of upgrade
    decision = 'stamp'

with open('/tmp/migration_decision', 'w') as f:
    f.write(decision)

cur.close()
conn.close()
PY

MIGRATION_DECISION=$(cat /tmp/migration_decision || echo upgrade)
echo "📦 Migration decision: $MIGRATION_DECISION"

if [ "$MIGRATION_DECISION" = "stamp" ]; then
  echo "🔖 Stamping database as up-to-date (head) to avoid duplicate object creation..."
  python -m alembic stamp head || echo "⚠️ Stamp warning (continuing...)"
else
  echo "⬆️  Running alembic upgrade head..."
  python -m alembic upgrade head || echo "⚠️ Migration warning (continuing...)"
fi

# Start the application
echo "🎯 Starting FastAPI application..."
exec "$@"