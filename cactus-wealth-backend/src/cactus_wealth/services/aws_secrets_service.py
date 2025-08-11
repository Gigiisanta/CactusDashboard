"""
AWS Secrets Manager service for Cactus Wealth application.
Handles secure credential storage and retrieval.
"""

import json
import logging
from typing import Any

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import HTTPException, status

from ..core.config import settings

logger = logging.getLogger(__name__)


class AWSSecretsService:
    """Service for managing AWS Secrets Manager operations."""

    def __init__(self):
        """Initialize AWS Secrets Manager client."""
        try:
            # Initialize boto3 client for Secrets Manager
            self.client = boto3.client(
                'secretsmanager',
                region_name=getattr(settings, 'AWS_REGION', 'us-east-1')
            )
            logger.info("AWS Secrets Manager client initialized successfully")
        except NoCredentialsError:
            logger.warning("AWS credentials not found. Secrets Manager will not be available.")
            self.client = None
        except Exception as e:
            logger.error(f"Failed to initialize AWS Secrets Manager client: {e}")
            self.client = None

    def create_secret(self, secret_name: str, secret_value: dict[str, Any], description: str = "") -> bool:
        """
        Create a new secret in AWS Secrets Manager.

        Args:
            secret_name: Name of the secret
            secret_value: Dictionary containing the secret data
            description: Optional description for the secret

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.client:
            logger.error("AWS Secrets Manager client not available")
            return False

        try:
            self.client.create_secret(
                Name=secret_name,
                Description=description,
                SecretString=json.dumps(secret_value)
            )
            logger.info(f"Secret '{secret_name}' created successfully")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceExistsException':
                logger.warning(f"Secret '{secret_name}' already exists")
                return self.update_secret(secret_name, secret_value)
            else:
                logger.error(f"Failed to create secret '{secret_name}': {e}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error creating secret '{secret_name}': {e}")
            return False

    def get_secret(self, secret_name: str) -> dict[str, Any] | None:
        """
        Retrieve a secret from AWS Secrets Manager.

        Args:
            secret_name: Name of the secret to retrieve

        Returns:
            Dict containing the secret data, or None if not found
        """
        if not self.client:
            logger.error("AWS Secrets Manager client not available")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AWS Secrets Manager service not available"
            )

        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            secret_string = response['SecretString']
            return json.loads(secret_string)
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.warning(f"Secret '{secret_name}' not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Secret '{secret_name}' not found"
                ) from e
            elif error_code == 'InvalidRequestException':
                logger.error(f"Invalid request for secret '{secret_name}': {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid secret request"
                ) from e
            elif error_code == 'InvalidParameterException':
                logger.error(f"Invalid parameter for secret '{secret_name}': {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid secret parameter"
                ) from e
            else:
                logger.error(f"Failed to retrieve secret '{secret_name}': {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve secret"
                ) from e
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse secret '{secret_name}' as JSON: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid secret format"
            ) from e
        except Exception as e:
            logger.error(f"Unexpected error retrieving secret '{secret_name}': {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unexpected error retrieving secret"
            ) from e

    def update_secret(self, secret_name: str, secret_value: dict[str, Any]) -> bool:
        """
        Update an existing secret in AWS Secrets Manager.

        Args:
            secret_name: Name of the secret to update
            secret_value: New secret data

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.client:
            logger.error("AWS Secrets Manager client not available")
            return False

        try:
            self.client.update_secret(
                SecretId=secret_name,
                SecretString=json.dumps(secret_value)
            )
            logger.info(f"Secret '{secret_name}' updated successfully")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.warning(f"Secret '{secret_name}' not found for update")
                return self.create_secret(secret_name, secret_value)
            else:
                logger.error(f"Failed to update secret '{secret_name}': {e}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error updating secret '{secret_name}': {e}")
            return False

    def delete_secret(self, secret_name: str, force_delete: bool = False) -> bool:
        """
        Delete a secret from AWS Secrets Manager.

        Args:
            secret_name: Name of the secret to delete
            force_delete: If True, delete immediately without recovery window

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.client:
            logger.error("AWS Secrets Manager client not available")
            return False

        try:
            if force_delete:
                self.client.delete_secret(
                    SecretId=secret_name,
                    ForceDeleteWithoutRecovery=True
                )
            else:
                self.client.delete_secret(SecretId=secret_name)

            logger.info(f"Secret '{secret_name}' deleted successfully")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.warning(f"Secret '{secret_name}' not found for deletion")
                return True  # Consider it successful if already deleted
            else:
                logger.error(f"Failed to delete secret '{secret_name}': {e}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error deleting secret '{secret_name}': {e}")
            return False

    def list_secrets(self, prefix: str = "cactus-") -> list[str]:
        """
        List all secrets with a given prefix.

        Args:
            prefix: Prefix to filter secrets

        Returns:
            List of secret names
        """
        if not self.client:
            logger.error("AWS Secrets Manager client not available")
            return []

        try:
            response = self.client.list_secrets()
            secrets = []
            for secret in response.get('SecretList', []):
                secret_name = secret['Name']
                if secret_name.startswith(prefix):
                    secrets.append(secret_name)
            return secrets
        except Exception as e:
            logger.error(f"Failed to list secrets: {e}")
            return []

    def test_connection(self) -> bool:
        """
        Test the connection to AWS Secrets Manager.

        Returns:
            bool: True if connection is working, False otherwise
        """
        if not self.client:
            return False

        try:
            # Try to list secrets to test connection
            self.client.list_secrets(MaxResults=1)
            return True
        except Exception as e:
            logger.error(f"AWS Secrets Manager connection test failed: {e}")
            return False


# Global instance
aws_secrets_service = AWSSecretsService()
