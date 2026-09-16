from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent

RAW_DATA = PROJECT_ROOT / "data" / "raw"
PROCESSED_DATA = PROJECT_ROOT / "data" / "processed"
FEATURES_DATA = PROJECT_ROOT / "data" / "features"
REJECTED_DATA = PROJECT_ROOT / "data" / "rejected"

UCI_PATH = (
    RAW_DATA
    / "messages"
    / "uci_sms"
    / "SMSSpamCollection.tsv"
)

SPAMASSASSIN_PATH = (
    RAW_DATA
    / "messages"
    / "spamassassin"
)

PHISHING_EMAILS_PATH = (
    RAW_DATA
    / "messages"
    / "phishing_emails"
)

TRANSACTIONS_PATH = (
    RAW_DATA
    / "transactions"
)