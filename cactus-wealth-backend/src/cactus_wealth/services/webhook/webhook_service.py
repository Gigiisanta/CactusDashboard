import asyncio
import json
import os
from datetime import UTC, datetime
from typing import Any

import redis
from sqlmodel import Session

from cactus_wealth.models import Client, Portfolio, Notification, User

# Import webhook system
import sys
sys.path.append('/app/src')
from cactuscrm.webhook_service import WebhookService
from cactuscrm.webhook_config import WebhookEventType, DEFAULT_N8N_CONFIG

from cactus_wealth.core.logging_config import get_structured_logger

logger = get_structured_logger(__name__)


class CactusWebhookService:
    """Service for sending webhooks to n8n and other external systems"""

    def __init__(self):
        self.webhook_service = WebhookService()
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
        
        # Initialize with default n8n webhook
        asyncio.create_task(self._initialize_webhooks())

    async def _initialize_webhooks(self):
        """Initialize default webhook configurations"""
        try:
            await self.webhook_service.add_webhook(DEFAULT_N8N_CONFIG)
            logger.info("webhook_service_initialized", webhook_url=DEFAULT_N8N_CONFIG.url)
        except Exception as e:
            logger.error("webhook_service_init_failed", error=str(e))

    def emit_client_event(self, event_type: str, client_data: dict[str, Any]) -> bool:
        """Encola un evento de cliente en Redis para ser procesado por un worker."""
        event = {
            "event": event_type,
            "payload": client_data,
        }
        try:
            self.redis_client.rpush("outbox:client_events", json.dumps(event))
            return True
        except Exception as e:
            logger.error("failed_to_queue_event", error=str(e))
            return False

    async def client_created(self, client: "Client") -> None:
        """Send webhook when client is created"""
        client_data = {
            "id": client.id,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "email": client.email,
            "status": (
                client.status.value
                if hasattr(client.status, "value")
                else str(client.status)
            ),
            "risk_profile": (
                client.risk_profile.value
                if hasattr(client.risk_profile, "value")
                else str(client.risk_profile)
            ),
            "lead_source": (
                client.lead_source.value
                if hasattr(client.lead_source, "value")
                else str(client.lead_source) if client.lead_source else None
            ),
            "notes": client.notes,
            "portfolio_name": client.portfolio_name,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "updated_at": client.updated_at.isoformat() if client.updated_at else None,
        }
        
        # Send webhook
        await self.webhook_service.trigger_event(
            WebhookEventType.CLIENT_CREATED,
            client_data
        )
        
        # Also queue for Redis processing (backward compatibility)
        self.emit_client_event("client.created", client_data)

    async def client_updated(self, client: "Client") -> None:
        """Send webhook when client is updated"""
        client_data = {
            "id": client.id,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "email": client.email,
            "status": (
                client.status.value
                if hasattr(client.status, "value")
                else str(client.status)
            ),
            "risk_profile": (
                client.risk_profile.value
                if hasattr(client.risk_profile, "value")
                else str(client.risk_profile)
            ),
            "lead_source": (
                client.lead_source.value
                if hasattr(client.lead_source, "value")
                else str(client.lead_source) if client.lead_source else None
            ),
            "notes": client.notes,
            "portfolio_name": client.portfolio_name,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "updated_at": client.updated_at.isoformat() if client.updated_at else None,
        }
        
        # Send webhook
        await self.webhook_service.trigger_event(
            WebhookEventType.CLIENT_UPDATED,
            client_data
        )
        
        # Also queue for Redis processing (backward compatibility)
        self.emit_client_event("client.updated", client_data)

    async def portfolio_created(self, portfolio: "Portfolio") -> None:
        """Send webhook when portfolio is created"""
        portfolio_data = {
            "id": portfolio.id,
            "name": portfolio.name,
            "client_id": portfolio.client_id,
            "created_at": portfolio.created_at.isoformat() if portfolio.created_at else None,
        }
        
        await self.webhook_service.trigger_event(
            WebhookEventType.PORTFOLIO_CREATED,
            portfolio_data
        )

    async def portfolio_updated(self, portfolio: "Portfolio") -> None:
        """Send webhook when portfolio is updated"""
        portfolio_data = {
            "id": portfolio.id,
            "name": portfolio.name,
            "client_id": portfolio.client_id,
            "updated_at": portfolio.updated_at.isoformat() if portfolio.updated_at else None,
        }
        
        await self.webhook_service.trigger_event(
            WebhookEventType.PORTFOLIO_UPDATED,
            portfolio_data
        )

    async def notification_sent(self, notification: "Notification") -> None:
        """Send webhook when notification is sent"""
        notification_data = {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "sent_at": datetime.now(UTC).isoformat(),
        }
        
        await self.webhook_service.trigger_event(
            WebhookEventType.NOTIFICATION_SENT,
            notification_data
        )

    async def user_registered(self, user: "User") -> None:
        """Send webhook when user is registered"""
        user_data = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        
        await self.webhook_service.trigger_event(
            WebhookEventType.USER_REGISTERED,
            user_data
        )


# Global webhook service instance
webhook_service = CactusWebhookService()