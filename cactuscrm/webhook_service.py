import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

import aiohttp
from .webhook_config import WebhookConfig, WebhookPayload, WebhookEventType, DEFAULT_N8N_CONFIG

logger = logging.getLogger(__name__)


class WebhookService:
    def __init__(self):
        self.webhooks: List[WebhookConfig] = [DEFAULT_N8N_CONFIG]
        self.session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self.session

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()

    def add_webhook(self, webhook: WebhookConfig):
        self.webhooks.append(webhook)

    def remove_webhook(self, name: str):
        self.webhooks = [w for w in self.webhooks if w.name != name]

    def get_webhooks_for_event(self, event: WebhookEventType) -> List[WebhookConfig]:
        return [w for w in self.webhooks if w.active and event in w.events]

    async def send_webhook(self, webhook: WebhookConfig, payload: WebhookPayload) -> bool:
        session = await self._get_session()
        headers = webhook.headers or {}
        
        if webhook.secret:
            headers["X-Webhook-Secret"] = webhook.secret

        try:
            async with session.post(
                str(webhook.url),
                json=payload.dict(),
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=webhook.timeout)
            ) as response:
                if response.status < 400:
                    logger.info(f"Webhook {webhook.name} sent successfully: {response.status}")
                    return True
                else:
                    logger.error(f"Webhook {webhook.name} failed: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Webhook {webhook.name} error: {str(e)}")
            return False

    async def trigger_event(self, event: WebhookEventType, data: Dict):
        webhooks = self.get_webhooks_for_event(event)
        if not webhooks:
            logger.debug(f"No webhooks configured for event: {event}")
            return

        payload = WebhookPayload(
            event=event,
            timestamp=datetime.utcnow().isoformat(),
            data=data,
            webhook_id=str(uuid4())
        )

        tasks = []
        for webhook in webhooks:
            task = self._send_with_retry(webhook, payload)
            tasks.append(task)

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _send_with_retry(self, webhook: WebhookConfig, payload: WebhookPayload):
        for attempt in range(webhook.retry_count + 1):
            payload.retry_count = attempt
            success = await self.send_webhook(webhook, payload)
            
            if success:
                return True
            
            if attempt < webhook.retry_count:
                wait_time = 2 ** attempt
                logger.info(f"Retrying webhook {webhook.name} in {wait_time}s (attempt {attempt + 1})")
                await asyncio.sleep(wait_time)
        
        logger.error(f"Webhook {webhook.name} failed after {webhook.retry_count + 1} attempts")
        return False


webhook_service = WebhookService()