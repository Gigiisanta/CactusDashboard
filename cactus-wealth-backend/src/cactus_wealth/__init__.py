# Import client_event_bus to register SQLAlchemy event listeners
# Import conditionally to avoid table redefinition issues during testing
import logging

try:
    # Import services module to make it available
    from . import services
except Exception as e:
    logging.warning(f"services import failed: {e}")

try:
    pass
except Exception as e:
    logging.warning(f"client_event_bus import failed: {e}")
