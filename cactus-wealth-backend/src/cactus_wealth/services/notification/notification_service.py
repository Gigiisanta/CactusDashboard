import asyncio
import json
from datetime import datetime

from sqlmodel import Session

from cactus_wealth.models import Asset, Notification
from cactus_wealth.repositories.notification_repository import NotificationRepository
from cactus_wealth.core.logging_config import get_structured_logger

logger = get_structured_logger(__name__)


class NotificationService:
    """
    🚀 ENHANCED: Service class for managing user notifications with real-time WebSocket support.
    """

    def __init__(self, db_session: Session):
        """Initialize the notification service."""
        self.db = db_session
        self.notification_repo = NotificationRepository(db_session)

    def create_notification(self, user_id: int, message: str) -> Notification:
        """
        Create a notification and send it in real-time.

        Args:
            user_id: ID of the user to notify
            message: Notification message

        Returns:
            The created Notification object
        """
        logger.info("notification_creation_started", user_id=user_id, message=message)

        # Create notification in the database
        notification = Notification(user_id=user_id, message=message)
        notification = self.notification_repo.create(notification)

        # 🚀 REAL-TIME: Send notification via WebSocket
        # We use asyncio.create_task to send the notification without
        # blocking the main thread.
        try:
            # ✅ FIX: Pass primitive types to the async task to prevent DetachedInstanceError.
            # The session that created the `notification` object may close before the task runs.
            # By passing primitive data, we decouple the task from the session.
            asyncio.create_task(
                self._send_realtime_notification(
                    user_id=notification.user_id,
                    message=notification.message,
                    notification_id=notification.id,
                    read_status=notification.read,
                    created_iso=notification.created_at.isoformat(),
                )
            )
            logger.info(
                "realtime_notification_task_created", notification_id=notification.id
            )
        except Exception as e:
            logger.error("realtime_notification_dispatch_failed", error=str(e))

        return notification

    async def create_notification_async(
        self, user_id: int, message: str
    ) -> Notification:
        """
        Creates a notification asynchronously and sends it in real-time.

        This method is suitable for use in async contexts.
        """
        logger.info(
            "async_notification_creation_started", user_id=user_id, message=message
        )

        notification = await self.notification_repo.create_async(
            user_id=user_id, message=message
        )

        # Dispatch real-time notification
        try:
            await self._send_realtime_notification(
                user_id=notification.user_id,
                message=notification.message,
                notification_id=notification.id,
                read_status=notification.read,
                created_iso=notification.created_at.isoformat(),
            )
            logger.info(
                "async_realtime_notification_sent", notification_id=notification.id
            )
        except Exception as e:
            logger.error("async_realtime_notification_dispatch_failed", error=str(e))

        return notification

    async def _send_realtime_notification(
        self,
        user_id: int,
        message: str,
        notification_id: int,
        read_status: bool,
        created_iso: str,
    ):
        """
        Sends a notification to a user via WebSocket using primitive data types.

        Args:
            user_id: The ID of the user to send the notification to.
            message: The content of the notification message.
            notification_id: The ID of the notification.
            read_status: The read status of the notification.
            created_iso: The ISO formatted creation timestamp.
        """
        from cactus_wealth.core.websocket_manager import manager  # Defer import

        logger.info("realtime_notification_sending", notification_id=notification_id)

        # Construct the payload
        payload = {
            "type": "notification",
            "payload": {
                "id": notification_id,
                "message": message,
                "read": read_status,
                "created_at": created_iso,
            },
        }

        # Send the message through the WebSocket manager
        try:
            await manager.send_personal_message(json.dumps(payload), user_id)
            logger.info(
                "realtime_notification_sent_successfully",
                user_id=user_id,
                notification_id=notification_id,
            )
        except Exception as e:
            logger.error(
                "websocket_send_failed",
                user_id=user_id,
                notification_id=notification_id,
                error=str(e),
            )