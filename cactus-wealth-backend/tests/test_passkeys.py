# file: /Users/prueba/Desktop/CactusDashboard/cactus-wealth-backend/tests/test_passkeys.py
"""
Tests for WebAuthn/Passkey authentication endpoints.
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlmodel import Session

from cactus_wealth.models import User, WebAuthnCredential


@pytest.fixture
def mock_webauthn_service():
    """Mock WebAuthn service for testing."""
    with patch("cactus_wealth.api.v1.endpoints.passkeys.WebAuthnService") as mock:
        service_instance = AsyncMock()
        mock.return_value = service_instance
        yield service_instance


@pytest.fixture
def sample_user(session: Session) -> User:
    """Create a sample user for testing."""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="$2b$12$test_hash",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def sample_credential(session: Session, sample_user: User) -> WebAuthnCredential:
    """Create a sample WebAuthn credential for testing."""
    credential = WebAuthnCredential(
        user_id=sample_user.id,
        credential_id="test_credential_id",
        public_key=b"test_public_key",
        sign_count=0,
        transports='["usb", "nfc"]',
        aaguid="test_aaguid",
        backup_eligible=True,
        backup_state=False,
        device_type="single_device",
        created_at=datetime.now(UTC),
    )
    session.add(credential)
    session.commit()
    session.refresh(credential)
    return credential


class TestPasskeyRegistration:
    """Test passkey registration endpoints."""

    async def test_get_registration_options_success(
        self,
        client: AsyncClient,
        authenticated_headers: dict,
        mock_webauthn_service: AsyncMock,
    ):
        """Test successful generation of registration options."""
        # Mock service response
        mock_options = {
            "challenge": "test_challenge_123",
            "rp": {"id": "localhost", "name": "Cactus Wealth"},
            "user": {
                "id": "user_id_123",
                "name": "test@example.com",
                "displayName": "Test User",
            },
            "pubKeyCredParams": [{"alg": -7, "type": "public-key"}],
            "timeout": 60000,
            "attestation": "none",
        }
        mock_webauthn_service.generate_registration_options.return_value = mock_options

        # Make request
        response = await client.post(
            "/api/v1/auth/passkeys/register/options",
            json={"username": "testuser"},
            headers=authenticated_headers,
        )

        # Assertions
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["challenge"] == "test_challenge_123"
        assert data["rp"]["id"] == "localhost"
        mock_webauthn_service.generate_registration_options.assert_called_once()

    async def test_register_passkey_success(
        self,
        client: AsyncClient,
        authenticated_headers: dict,
        mock_webauthn_service: AsyncMock,
        sample_user: User,
    ):
        """Test successful passkey registration."""
        # First, set up a challenge
        with patch("cactus_wealth.api.v1.endpoints.passkeys._challenges") as mock_challenges:
            challenge_key = f"reg_{sample_user.id}_test_challenge"
            mock_challenges.__getitem__.return_value = {
                "challenge": "test_challenge",
                "user_id": sample_user.id,
                "type": "registration",
            }
            mock_challenges.__contains__.return_value = True
            mock_challenges.items.return_value = [
                (challenge_key, {
                    "challenge": "test_challenge",
                    "user_id": sample_user.id,
                    "type": "registration",
                })
            ]

            # Mock credential creation
            mock_credential = WebAuthnCredential(
                id=1,
                user_id=sample_user.id,
                credential_id="test_credential_id",
                public_key=b"test_public_key",
                sign_count=0,
                transports='["usb"]',
                aaguid="test_aaguid",
                backup_eligible=True,
                backup_state=False,
                device_type="single_device",
                created_at=datetime.now(UTC),
            )
            mock_webauthn_service.verify_registration_response.return_value = mock_credential

            # Make request
            request_data = {
                "credential_id": "test_credential_id",
                "attestation_object": "test_attestation_object",
                "client_data_json": "test_client_data_json",
                "transports": ["usb"],
            }

            response = await client.post(
                "/api/v1/auth/passkeys/register",
                json=request_data,
                headers=authenticated_headers,
            )

            # Assertions
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["credential_id"] == "test_credential_id"
            assert data["user_id"] == sample_user.id
            mock_webauthn_service.verify_registration_response.assert_called_once()

    async def test_register_passkey_invalid_challenge(
        self,
        client: AsyncClient,
        authenticated_headers: dict,
        mock_webauthn_service: AsyncMock,
    ):
        """Test passkey registration with invalid challenge."""
        with patch("cactus_wealth.api.v1.endpoints.passkeys._challenges", {}):
            request_data = {
                "credential_id": "test_credential_id",
                "attestation_object": "test_attestation_object",
                "client_data_json": "test_client_data_json",
                "transports": ["usb"],
            }

            response = await client.post(
                "/api/v1/auth/passkeys/register",
                json=request_data,
                headers=authenticated_headers,
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "Invalid or expired challenge" in response.json()["detail"]


class TestPasskeyAuthentication:
    """Test passkey authentication endpoints."""

    async def test_get_authentication_options_success(
        self,
        client: AsyncClient,
        mock_webauthn_service: AsyncMock,
    ):
        """Test successful generation of authentication options."""
        # Mock service response
        mock_options = {
            "challenge": "test_auth_challenge",
            "timeout": 60000,
            "rpId": "localhost",
            "allowCredentials": [],
        }
        mock_webauthn_service.generate_authentication_options.return_value = mock_options

        # Make request
        response = await client.post(
            "/api/v1/auth/passkeys/login/options",
            json={"username": "testuser"},
        )

        # Assertions
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["challenge"] == "test_auth_challenge"
        assert data["rpId"] == "localhost"
        mock_webauthn_service.generate_authentication_options.assert_called_once()

    async def test_login_with_passkey_success(
        self,
        client: AsyncClient,
        mock_webauthn_service: AsyncMock,
        sample_user: User,
        sample_credential: WebAuthnCredential,
    ):
        """Test successful passkey authentication."""
        with patch("cactus_wealth.api.v1.endpoints.passkeys._challenges") as mock_challenges:
            challenge_key = "auth_test_challenge"
            mock_challenges.__getitem__.return_value = {
                "challenge": "test_challenge",
                "user_id": sample_user.id,
                "type": "authentication",
            }
            mock_challenges.__contains__.return_value = True
            mock_challenges.items.return_value = [
                (challenge_key, {
                    "challenge": "test_challenge",
                    "user_id": sample_user.id,
                    "type": "authentication",
                })
            ]

            # Mock authentication verification
            mock_webauthn_service.verify_authentication_response.return_value = (
                sample_user,
                sample_credential,
            )

            # Make request
            request_data = {
                "credential_id": "test_credential_id",
                "authenticator_data": "test_authenticator_data",
                "client_data_json": "test_client_data_json",
                "signature": "test_signature",
                "user_handle": "test_user_handle",
            }

            response = await client.post(
                "/api/v1/auth/passkeys/login",
                json=request_data,
            )

            # Assertions
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            mock_webauthn_service.verify_authentication_response.assert_called_once()

    async def test_login_with_passkey_invalid_challenge(
        self,
        client: AsyncClient,
        mock_webauthn_service: AsyncMock,
    ):
        """Test passkey authentication with invalid challenge."""
        with patch("cactus_wealth.api.v1.endpoints.passkeys._challenges", {}):
            request_data = {
                "credential_id": "test_credential_id",
                "authenticator_data": "test_authenticator_data",
                "client_data_json": "test_client_data_json",
                "signature": "test_signature",
                "user_handle": "test_user_handle",
            }

            response = await client.post(
                "/api/v1/auth/passkeys/login",
                json=request_data,
            )

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "Invalid or expired challenge" in response.json()["detail"]

    async def test_login_with_passkey_verification_failed(
        self,
        client: AsyncClient,
        mock_webauthn_service: AsyncMock,
    ):
        """Test passkey authentication with verification failure."""
        with patch("cactus_wealth.api.v1.endpoints.passkeys._challenges") as mock_challenges:
            challenge_key = "auth_test_challenge"
            mock_challenges.items.return_value = [
                (challenge_key, {
                    "challenge": "test_challenge",
                    "user_id": None,
                    "type": "authentication",
                })
            ]

            # Mock verification failure
            mock_webauthn_service.verify_authentication_response.side_effect = ValueError(
                "Invalid signature"
            )

            request_data = {
                "credential_id": "test_credential_id",
                "authenticator_data": "test_authenticator_data",
                "client_data_json": "test_client_data_json",
                "signature": "invalid_signature",
                "user_handle": "test_user_handle",
            }

            response = await client.post(
                "/api/v1/auth/passkeys/login",
                json=request_data,
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Invalid signature" in response.json()["detail"]


class TestCredentialManagement:
    """Test credential management endpoints."""

    async def test_get_user_credentials_success(
        self,
        client: AsyncClient,
        authenticated_headers: dict,
        mock_webauthn_service: AsyncMock,
        sample_credential: WebAuthnCredential,
    ):
        """Test successful retrieval of user credentials."""
        mock_webauthn_service.get_user_credentials.return_value = [sample_credential]

        response = await client.get(
            "/api/v1/auth/passkeys/credentials",
            headers=authenticated_headers,
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["credential_id"] == "test_credential_id"
        mock_webauthn_service.get_user_credentials.assert_called_once()

    async def test_delete_credential_success(
        self,
        client: AsyncClient,
        authenticated_headers: dict,
        mock_webauthn_service: AsyncMock,
    ):
        """Test successful credential deletion."""
        mock_webauthn_service.delete_credential.return_value = True

        response = await client.delete(
            "/api/v1/auth/passkeys/credentials/test_credential_id",
            headers=authenticated_headers,
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Credential deleted successfully"
        # Ensure called with credential id and some user id
        called_args, _ = mock_webauthn_service.delete_credential.call_args
        assert called_args[0] == "test_credential_id"
        assert isinstance(called_args[1], int)

    async def test_delete_credential_not_found(
        self,
        client: AsyncClient,
        authenticated_headers: dict,
        mock_webauthn_service: AsyncMock,
    ):
        """Test credential deletion when credential not found."""
        mock_webauthn_service.delete_credential.return_value = False

        response = await client.delete(
            "/api/v1/auth/passkeys/credentials/nonexistent_id",
            headers=authenticated_headers,
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Credential not found" in response.json()["detail"]


class TestSignCountValidation:
    """Test sign count validation scenarios."""

    async def test_authentication_with_invalid_sign_count(
        self,
        client: AsyncClient,
        mock_webauthn_service: AsyncMock,
    ):
        """Test authentication failure due to invalid sign count."""
        with patch("cactus_wealth.api.v1.endpoints.passkeys._challenges") as mock_challenges:
            challenge_key = "auth_test_challenge"
            mock_challenges.items.return_value = [
                (challenge_key, {
                    "challenge": "test_challenge",
                    "user_id": None,
                    "type": "authentication",
                })
            ]

            # Mock sign count validation failure
            mock_webauthn_service.verify_authentication_response.side_effect = ValueError(
                "Sign count validation failed"
            )

            request_data = {
                "credential_id": "test_credential_id",
                "authenticator_data": "test_authenticator_data",
                "client_data_json": "test_client_data_json",
                "signature": "test_signature",
                "user_handle": "test_user_handle",
            }

            response = await client.post(
                "/api/v1/auth/passkeys/login",
                json=request_data,
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Sign count validation failed" in response.json()["detail"]


class TestUsernamelessAuthentication:
    """Test usernameless authentication scenarios."""

    async def test_get_authentication_options_usernameless(
        self,
        client: AsyncClient,
        mock_webauthn_service: AsyncMock,
    ):
        """Test generation of authentication options without username."""
        mock_options = {
            "challenge": "test_auth_challenge",
            "timeout": 60000,
            "rpId": "localhost",
            "allowCredentials": [],
        }
        mock_webauthn_service.generate_authentication_options.return_value = mock_options

        # Make request without username
        response = await client.post(
            "/api/v1/auth/passkeys/login/options",
            json={},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["challenge"] == "test_auth_challenge"
        # Verify service was called with None (usernameless)
        mock_webauthn_service.generate_authentication_options.assert_called_once_with(None)
