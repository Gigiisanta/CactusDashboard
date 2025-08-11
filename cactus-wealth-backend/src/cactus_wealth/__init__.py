import logging
import os

# Avoid importing services (and their transitive imports) during Alembic runs
if not os.getenv("ALEMBIC_RUNNING"):
    try:
        from . import services  # noqa: F401
    except Exception as e:
        logging.warning(f"services import failed: {e}")

# Reserved for future event-bus imports (guarded similarly)
