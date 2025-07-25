from typing import Dict, List, Optional
from pydantic import BaseModel, HttpUrl
from enum import Enum


class WebhookEventType(str, Enum):
    CLIENT_CREATED = "client.created"
    CLIENT_UPDATED = "client.updated"
    CLIENT_DELETED = "client.deleted"
    PORTFOLIO_CREATED = "portfolio.created"
    PORTFOLIO_UPDATED = "portfolio.updated"
    NOTIFICATION_SENT = "notification.sent"
    USER_REGISTERED = "user.registered"


class WebhookConfig(BaseModel):
    name: str
    url: HttpUrl
    events: List[WebhookEventType]
    active: bool = True
    secret: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    retry_count: int = 3
    timeout: int = 30


class WebhookPayload(BaseModel):
    event: WebhookEventType
    timestamp: str
    data: Dict
    webhook_id: str
    retry_count: int = 0


DEFAULT_N8N_CONFIG = WebhookConfig(
    name="n8n_automation",
    url="http://n8n:5678/webhook/cactus",
    events=[
        WebhookEventType.CLIENT_CREATED,
        WebhookEventType.CLIENT_UPDATED,
        WebhookEventType.PORTFOLIO_CREATED,
        WebhookEventType.USER_REGISTERED,
        WebhookEventType.NOTIFICATION_SENT
    ],
    active=True,
    headers={"Content-Type": "application/json"},
    retry_count=3,
    timeout=30
)