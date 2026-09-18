from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.transaction import Transaction


class TransactionStatusNotificationObserver:
    def __init__(self, db: Session):
        self.db = db

    def on_status_changed(
        self,
        transaction: Transaction,
        old_status: str,
        new_status: str,
    ) -> None:
        notification = Notification(
            user_id=transaction.user_id,
            transaction_db_id=transaction.id,
            title="Transaction status updated",
            message=(
                f"Transaction {transaction.transaction_id} "
                f"status changed from {old_status} to {new_status}."
            ),
            is_read=False,
        )

        self.db.add(notification)
        self.db.commit()