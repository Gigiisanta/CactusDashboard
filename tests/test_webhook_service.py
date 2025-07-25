import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from cactuscrm.webhook_service import WebhookService
from cactuscrm.webhook_config import WebhookConfig, WebhookEventType


@pytest.fixture
def webhook_service():
    return WebhookService()


@pytest.fixture
def test_webhook():
    return WebhookConfig(
        name="test_webhook",
        url="http://test.example.com/webhook",
        events=[WebhookEventType.CLIENT_CREATED],
        active=True,
        retry_count=2,
        timeout=10
    )


@pytest.mark.asyncio
async def test_add_webhook(webhook_service, test_webhook):
    initial_count = len(webhook_service.webhooks)
    webhook_service.add_webhook(test_webhook)
    assert len(webhook_service.webhooks) == initial_count + 1
    assert test_webhook in webhook_service.webhooks


@pytest.mark.asyncio
async def test_remove_webhook(webhook_service, test_webhook):
    webhook_service.add_webhook(test_webhook)
    webhook_service.remove_webhook("test_webhook")
    assert test_webhook not in webhook_service.webhooks


@pytest.mark.asyncio
async def test_get_webhooks_for_event(webhook_service, test_webhook):
    webhook_service.add_webhook(test_webhook)
    webhooks = webhook_service.get_webhooks_for_event(WebhookEventType.CLIENT_CREATED)
    assert len(webhooks) >= 1
    assert any(w.name == "test_webhook" for w in webhooks)


@pytest.mark.asyncio
async def test_send_webhook_success(webhook_service, test_webhook):
    with patch('aiohttp.ClientSession.post') as mock_post:
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_post.return_value.__aenter__.return_value = mock_response
        
        from cactuscrm.webhook_config import WebhookPayload
        payload = WebhookPayload(
            event=WebhookEventType.CLIENT_CREATED,
            timestamp="2024-01-01T00:00:00",
            data={"test": "data"},
            webhook_id="test-id"
        )
        
        result = await webhook_service.send_webhook(test_webhook, payload)
        assert result is True


@pytest.mark.asyncio
async def test_send_webhook_failure(webhook_service, test_webhook):
    with patch('aiohttp.ClientSession.post') as mock_post:
        mock_response = AsyncMock()
        mock_response.status = 500
        mock_post.return_value.__aenter__.return_value = mock_response
        
        from cactuscrm.webhook_config import WebhookPayload
        payload = WebhookPayload(
            event=WebhookEventType.CLIENT_CREATED,
            timestamp="2024-01-01T00:00:00",
            data={"test": "data"},
            webhook_id="test-id"
        )
        
        result = await webhook_service.send_webhook(test_webhook, payload)
        assert result is False


@pytest.mark.asyncio
async def test_trigger_event(webhook_service, test_webhook):
    webhook_service.add_webhook(test_webhook)
    
    with patch.object(webhook_service, '_send_with_retry') as mock_send:
        mock_send.return_value = True
        
        await webhook_service.trigger_event(
            WebhookEventType.CLIENT_CREATED,
            {"client_id": "123", "name": "Test Client"}
        )
        
        assert mock_send.called


@pytest.mark.asyncio
async def test_webhook_retry_logic(webhook_service, test_webhook):
    with patch.object(webhook_service, 'send_webhook') as mock_send:
        mock_send.side_effect = [False, False, True]
        
        from cactuscrm.webhook_config import WebhookPayload
        payload = WebhookPayload(
            event=WebhookEventType.CLIENT_CREATED,
            timestamp="2024-01-01T00:00:00",
            data={"test": "data"},
            webhook_id="test-id"
        )
        
        result = await webhook_service._send_with_retry(test_webhook, payload)
        assert result is True
        assert mock_send.call_count == 3


@pytest.mark.asyncio
async def test_webhook_service_cleanup(webhook_service):
    await webhook_service.close()
    if webhook_service.session:
        assert webhook_service.session.closed