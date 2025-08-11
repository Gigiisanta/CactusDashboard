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
echo "🔄 Running database migrations..."
python -m alembic upgrade head || echo "⚠️ Migration warning (continuing...)"

# Start the application
echo "🎯 Starting FastAPI application..."
exec "$@"