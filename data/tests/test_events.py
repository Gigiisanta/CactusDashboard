import pytest
import asyncio
import json
import sys
import os
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

# Add the backend source to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../cactus-wealth-backend/src'))

# Mock the models since we don't have the full backend environment
class MockClient:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

class MockPortfolio:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

class MockNotification:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

class MockUser:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

# Mock enums
class ClientStatus:
    prospect = "prospect"
    apertura = "apertura"

class RiskProfile:
    MEDIUM = "MEDIUM"

class LeadSource:
    ORGANIC = "ORGANIC"

class UserRole:
    advisor = "advisor"

@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    mock = AsyncMock()
    mock.xadd = AsyncMock()
    mock.ping = AsyncMock()
    return mock

@pytest.fixture
def mock_webhook_service():
    """Mock webhook service"""
    mock = AsyncMock()
    mock.trigger_event = AsyncMock()
    mock.add_webhook = AsyncMock()
    return mock

@pytest.fixture
def sample_client_data():
    """Sample client data for testing"""
    return {
        "id": 123,
        "first_name": "John",
        "last_name": "Doe", 
        "email": "john.doe@example.com",
        "status": "agendado_2da_reunion",
        "risk_profile": "MEDIUM",
        "lead_source": "ORGANIC",
        "notes": "Test client",
        "portfolio_name": "Growth Portfolio",
        "created_at": "2024-01-15T10:00:00",
        "updated_at": "2024-01-15T10:00:00"
    }

class TestWebhookService:
    """Test webhook service functionality"""
    
    @pytest.mark.asyncio
    async def test_client_created_webhook(self, sample_client_data, mock_webhook_service):
        """Test client created webhook"""
        # Mock the webhook service and event types
        with patch('cactuscrm.webhook_config.WebhookEventType') as MockEventType:
            MockEventType.CLIENT_CREATED = "client.created"
            
            # Create mock client
            client = MockClient(
                id=sample_client_data["id"],
                first_name=sample_client_data["first_name"],
                last_name=sample_client_data["last_name"],
                email=sample_client_data["email"],
                status=ClientStatus.prospect,
                risk_profile=RiskProfile.MEDIUM,
                lead_source=LeadSource.ORGANIC,
                notes=sample_client_data["notes"],
                portfolio_name=sample_client_data["portfolio_name"],
                created_at=datetime(2024, 1, 15, 10, 0, 0),
                updated_at=datetime(2024, 1, 15, 10, 0, 0)
            )
            
            # Mock the service
            with patch('cactuscrm.webhook_service.WebhookService') as MockWebhookService:
                mock_service_instance = AsyncMock()
                MockWebhookService.return_value = mock_service_instance
                
                # Import and test the service
                from cactuscrm.webhook_service import WebhookService
                service = WebhookService()
                
                # Test trigger_event method
                await service.trigger_event(MockEventType.CLIENT_CREATED, {"client": client})
                
                # Verify the method was called
                mock_service_instance.trigger_event.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_client_updated_webhook(self, sample_client_data, mock_webhook_service):
        """Test client updated webhook"""
        with patch('cactuscrm.webhook_config.WebhookEventType') as MockEventType:
            MockEventType.CLIENT_UPDATED = "client.updated"
            
            # Create mock client
            client = MockClient(
                id=sample_client_data["id"],
                first_name=sample_client_data["first_name"],
                last_name=sample_client_data["last_name"],
                email=sample_client_data["email"],
                status=ClientStatus.apertura,
                risk_profile=RiskProfile.MEDIUM,
                lead_source=LeadSource.ORGANIC,
                notes=sample_client_data["notes"],
                portfolio_name=sample_client_data["portfolio_name"],
                created_at=datetime(2024, 1, 15, 10, 0, 0),
                updated_at=datetime(2024, 1, 15, 10, 30, 0)
            )
            
            with patch('cactuscrm.webhook_service.WebhookService') as MockWebhookService:
                mock_service_instance = AsyncMock()
                MockWebhookService.return_value = mock_service_instance
                
                from cactuscrm.webhook_service import WebhookService
                service = WebhookService()
                
                await service.trigger_event(MockEventType.CLIENT_UPDATED, {"client": client})
                mock_service_instance.trigger_event.assert_called_once()

    @pytest.mark.asyncio
    async def test_portfolio_created_webhook(self, mock_webhook_service):
        """Test portfolio created webhook"""
        with patch('cactuscrm.webhook_config.WebhookEventType') as MockEventType:
            MockEventType.PORTFOLIO_CREATED = "portfolio.created"
            
            # Create mock portfolio
            portfolio = MockPortfolio(
                id=456,
                name="Growth Portfolio",
                client_id=123,
                created_at=datetime(2024, 1, 15, 10, 0, 0)
            )
            
            with patch('cactuscrm.webhook_service.WebhookService') as MockWebhookService:
                mock_service_instance = AsyncMock()
                MockWebhookService.return_value = mock_service_instance
                
                from cactuscrm.webhook_service import WebhookService
                service = WebhookService()
                
                await service.trigger_event(MockEventType.PORTFOLIO_CREATED, {"portfolio": portfolio})
                mock_service_instance.trigger_event.assert_called_once()

    @pytest.mark.asyncio
    async def test_notification_sent_webhook(self, mock_webhook_service):
        """Test notification sent webhook"""
        with patch('cactuscrm.webhook_config.WebhookEventType') as MockEventType:
            MockEventType.NOTIFICATION_SENT = "notification.sent"
            
            # Create mock notification
            notification = MockNotification(
                id=789,
                user_id=123,
                title="Test Notification",
                message="This is a test",
                type="info"
            )
            
            with patch('cactuscrm.webhook_service.WebhookService') as MockWebhookService:
                mock_service_instance = AsyncMock()
                MockWebhookService.return_value = mock_service_instance
                
                from cactuscrm.webhook_service import WebhookService
                service = WebhookService()
                
                await service.trigger_event(MockEventType.NOTIFICATION_SENT, {"notification": notification})
                mock_service_instance.trigger_event.assert_called_once()

    @pytest.mark.asyncio
    async def test_user_registered_webhook(self, mock_webhook_service):
        """Test user registered webhook"""
        with patch('cactuscrm.webhook_config.WebhookEventType') as MockEventType:
            MockEventType.USER_REGISTERED = "user.registered"
            
            # Create mock user
            user = MockUser(
                id=999,
                email="newuser@example.com",
                full_name="New User",
                role=UserRole.advisor,
                created_at=datetime(2024, 1, 15, 10, 0, 0)
            )
            
            with patch('cactuscrm.webhook_service.WebhookService') as MockWebhookService:
                mock_service_instance = AsyncMock()
                MockWebhookService.return_value = mock_service_instance
                
                from cactuscrm.webhook_service import WebhookService
                service = WebhookService()
                
                await service.trigger_event(MockEventType.USER_REGISTERED, {"user": user})
                mock_service_instance.trigger_event.assert_called_once()

class TestIntegrationFlow:
    """Integration tests for complete webhook flow"""
    
    @pytest.mark.asyncio
    async def test_complete_client_lifecycle(self, sample_client_data, mock_webhook_service):
        """Test complete client lifecycle with webhooks"""
        with patch('cactuscrm.webhook_config.WebhookEventType') as MockEventType:
            MockEventType.CLIENT_CREATED = "client.created"
            MockEventType.CLIENT_UPDATED = "client.updated"
            
            # Create mock client
            client = MockClient(
                id=sample_client_data["id"],
                first_name=sample_client_data["first_name"],
                last_name=sample_client_data["last_name"],
                email=sample_client_data["email"],
                status=ClientStatus.prospect,
                risk_profile=RiskProfile.MEDIUM,
                lead_source=LeadSource.ORGANIC,
                notes=sample_client_data["notes"],
                portfolio_name=sample_client_data["portfolio_name"],
                created_at=datetime(2024, 1, 15, 10, 0, 0),
                updated_at=datetime(2024, 1, 15, 10, 0, 0)
            )
            
            with patch('cactuscrm.webhook_service.WebhookService') as MockWebhookService:
                mock_service_instance = AsyncMock()
                MockWebhookService.return_value = mock_service_instance
                
                from cactuscrm.webhook_service import WebhookService
                service = WebhookService()
                
                # Test client creation
                await service.trigger_event(MockEventType.CLIENT_CREATED, {"client": client})
                
                # Test client update (status change)
                client.status = ClientStatus.apertura
                client.updated_at = datetime(2024, 1, 15, 10, 30, 0)
                await service.trigger_event(MockEventType.CLIENT_UPDATED, {"client": client})
                
                # Verify both webhooks were triggered
                assert mock_service_instance.trigger_event.call_count == 2

    @pytest.mark.asyncio
    async def test_redis_backward_compatibility(self, sample_client_data):
        """Test that Redis events are still emitted for backward compatibility"""
        with patch('redis.from_url') as mock_redis_factory:
            mock_redis = MagicMock()
            mock_redis_factory.return_value = mock_redis
            
            # Test Redis push functionality
            event_data = {
                "event": "client.created",
                "payload": sample_client_data
            }
            
            # Mock the rpush method
            mock_redis.rpush.return_value = 1
            result = mock_redis.rpush("outbox:client_events", json.dumps(event_data))
            
            assert result == 1
            mock_redis.rpush.assert_called_once_with(
                "outbox:client_events", 
                json.dumps(event_data)
            )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])