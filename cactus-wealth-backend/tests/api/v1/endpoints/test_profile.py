"""Test for user profile endpoint."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from cactus_wealth.models import User
from cactus_wealth.schemas import UserUpdate


def test_update_user_profile_success(
    client: TestClient,
    db_session: Session,
    test_user: User,
    auth_headers: dict,
):
    """Test successful user profile update."""
    # Arrange
    new_username = "updated_username"
    update_data = {"username": new_username}
    
    # Act
    response = client.put(
        "/api/v1/users/me",
        json=update_data,
        headers=auth_headers,
    )
    
    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["username"] == new_username
    assert response_data["email"] == test_user.email
    assert response_data["id"] == test_user.id
    
    # Verify in database
    db_session.refresh(test_user)
    assert test_user.username == new_username


def test_update_user_profile_unauthorized(client: TestClient):
    """Test user profile update without authentication."""
    # Arrange
    update_data = {"username": "new_username"}
    
    # Act
    response = client.put("/api/v1/users/me", json=update_data)
    
    # Assert
    assert response.status_code == 401


def test_update_user_profile_empty_username(
    client: TestClient,
    test_user: User,
    auth_headers: dict,
):
    """Test user profile update with empty username."""
    # Arrange
    update_data = {"username": ""}
    
    # Act
    response = client.put(
        "/api/v1/users/me",
        json=update_data,
        headers=auth_headers,
    )
    
    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["username"] == ""


def test_update_user_profile_only_username_field(
    client: TestClient,
    test_user: User,
    auth_headers: dict,
):
    """Test that only username field can be updated."""
    # Arrange
    original_email = test_user.email
    update_data = {
        "username": "new_username",
        "email": "newemail@example.com",  # This should be ignored
        "role": "admin",  # This should be ignored
    }
    
    # Act
    response = client.put(
        "/api/v1/users/me",
        json=update_data,
        headers=auth_headers,
    )
    
    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["username"] == "new_username"
    assert response_data["email"] == original_email  # Should remain unchanged
    assert response_data["role"] != "admin"  # Should remain unchanged