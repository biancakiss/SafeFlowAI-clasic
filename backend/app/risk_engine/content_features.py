import re

from .email_model import build_email_text


# 1. Detectează URL-uri și forme comune de linkuri
URL_PATTERN = re.compile(
    r"""
    (?:
        \bhttps?://[^\s<>()]+
        |\bftp://[^\s<>()]+
        |\bwww\.[^\s<>()]+
        |\b[a-z0-9.-]+\.(?:com|net|org|info|biz|xyz|online|site|top|
            shop|store|click|link|live|pro|app|club|me|co|io|ai)
            (?:/[^\s<>()]*)?
        |\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|
            buff\.ly|cutt\.ly|rb\.gy|rebrand\.ly|shorturl\.at|
            tiny\.cc|lnkd\.in|soo\.gd|v\.gd)/[^\s<>()]+
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)


# 2. Detectează linkuri cu risc ridicat
SUSPICIOUS_LINK_PATTERN = re.compile(
    r"""
    (?:
        https?://(?:\d{1,3}\.){3}\d{1,3}
        |https?://(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|
            is\.gd|buff\.ly|cutt\.ly|rb\.gy|rebrand\.ly|
            shorturl\.at|tiny\.cc|lnkd\.in|soo\.gd|v\.gd)/
        |https?://[^\s/]+@[^\s/]+
        |https?://[^\s]+:\d{2,5}/
        |https?://(?:www\.)?xn--[^\s/]+
        |https?://[^\s]*(?:login|log-in|signin|sign-in|verify|verification)
            [^\s]*
        |https?://[^\s]*(?:secure|security|account|update|confirm|validate)
            [^\s]*
        |https?://[^\s]*(?:password|passcode|credential|payment|billing)
            [^\s]*
        |https?://[^\s]*(?:wallet|crypto|bitcoin|ethereum|investment)
            [^\s]*
        |https?://[^\s]*(?:claim|prize|reward|bonus|gift|winner)
            [^\s]*
        |https?://[^\s]*(?:bank|paypal|microsoft|apple|google|amazon)
            [^\s]*(?:login|verify|secure|support)[^\s]*
        |https?://[^\s]+\.(?:xyz|top|click|work|rest|shop|live|site)
            (?:/[^\s]*)?
        |https?://[^\s]*(?:free|limited|exclusive|urgent|immediate)
            [^\s]*
        |https?://[^\s]*(?:download|attachment|document|invoice)
            [^\s]*
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)


# 3. Detectează solicitări de date sensibile
SENSITIVE_DATA_PATTERN = re.compile(
    r"""
    \b(?:
        password
        |passcode
        |verification\s+code
        |security\s+code
        |one[- ]time\s+code
        |one[- ]time\s+password
        |otp
        |pin\s+number
        |credit\s+card
        |debit\s+card
        |card\s+number
        |card\s+details
        |bank\s+account
        |account\s+number
        |account\s+details
        |routing\s+number
        |sort\s+code
        |social\s+security\s+number
        |tax\s+identification\s+number
        |government\s+id
        |identity\s+document
        |security\s+answer
        |mother'?s\s+maiden\s+name
        |login\s+credentials
        |billing\s+information
        |personal\s+information
    )\b
    """,
    re.IGNORECASE | re.VERBOSE,
)


# 4. Detectează presiune, amenințări și urgență artificială
URGENCY_PATTERN = re.compile(
    r"""
    \b(?:
        urgent
        |immediately
        |act\s+now
        |action\s+required
        |response\s+required
        |final\s+notice
        |last\s+chance
        |expires\s+today
        |offer\s+expires
        |within\s+24\s+hours
        |within\s+48\s+hours
        |limited\s+time
        |time\s+sensitive
        |do\s+not\s+delay
        |do\s+not\s+ignore
        |respond\s+immediately
        |failure\s+to\s+respond
        |your\s+account\s+will\s+be\s+suspended
        |your\s+account\s+will\s+be\s+closed
        |your\s+access\s+will\s+be\s+restricted
        |payment\s+is\s+overdue
        |immediate\s+attention
        |important\s+security\s+alert
        |your\s+service\s+will\s+be\s+terminated
    )\b
    """,
    re.IGNORECASE | re.VERBOSE,
)


# 5. Detectează expresii de spam, phishing și câștiguri false
SUSPICIOUS_PATTERN = re.compile(
    r"""
    \b(?:
        claim\s+your\s+prize
        |claim\s+your\s+reward
        |claim\s+your\s+bonus
        |you\s+have\s+won
        |you'?re\s+a\s+winner
        |congratulations
        |free\s+cash
        |free\s+gift
        |cash\s+reward
        |exclusive\s+offer
        |limited\s+offer
        |special\s+promotion
        |verify\s+your\s+account
        |confirm\s+your\s+identity
        |click\s+here
        |click\s+below
        |open\s+the\s+attachment
        |download\s+the\s+document
        |refund\s+available
        |tax\s+refund
        |payment\s+received
        |invoice\s+attached
        |your\s+package\s+is\s+waiting
        |delivery\s+attempt\s+failed
        |update\s+your\s+payment
        |unusual\s+activity\s+detected
        |suspicious\s+login\s+detected
        |your\s+account\s+has\s+been\s+compromised
        |we\s+need\s+to\s+verify\s+your\s+information
        |you'?ve\s+been\s+selected
        |you'?ve\s+been\s+pre[- ]approved
        |make\s+money\s+fast
        |earn\s+money\s+from\s+home
        |guaranteed\s+income
        |risk[- ]free\s+investment
        |double\s+your\s+money
    )\b
    """,
    re.IGNORECASE | re.VERBOSE,
)


def build_content_features(subject: str, body: str) -> dict:
    text = build_email_text(subject, body)

    return {
        "contains_link": bool(URL_PATTERN.search(text)),
        "contains_suspicious_link": bool(
            SUSPICIOUS_LINK_PATTERN.search(text)
        ),
        "requests_sensitive_data": bool(
            SENSITIVE_DATA_PATTERN.search(text)
        ),
        "uses_urgent_language": bool(
            URGENCY_PATTERN.search(text)
        ),
        "contains_suspicious_pattern": bool(
            SUSPICIOUS_PATTERN.search(text)
        ),
    }