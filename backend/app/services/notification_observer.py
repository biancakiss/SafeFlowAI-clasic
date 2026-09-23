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
            title=(
                "Transaction approved"
                if new_status == "approved"
                else "Transaction blocked"
                if new_status == "blocked"
                else "Transaction status updated"
            ),
            message=(
                f"Transaction {transaction.transaction_id} status changed "
                f"from {old_status} to {new_status}."
            ),
            is_read=False,
        )

        self.db.add(notification)
        self.db.commit()

    def on_transaction_analyzed(
        self,
        transaction: Transaction,
        risk_level: str,
        risk_score: int,
    ) -> None:
        is_high_risk = risk_level.upper() == "HIGH"

        notification = Notification(
            user_id=transaction.user_id,
            transaction_db_id=transaction.id,
            title=(
                "High-risk transaction analyzed"
                if is_high_risk
                else "Transaction analyzed"
            ),
            message=(
                f"Transaction {transaction.transaction_id} was analyzed "
                f"with a risk score of {risk_score}/100 and is awaiting "
                "your decision."
            ),
            is_read=False,
        )

        self.db.add(notification)
        self.db.commit()
