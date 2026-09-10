from sqlalchemy.orm import Session

from app.models.analysis import Analysis


def create_analysis(
    db: Session,
    analysis: Analysis,
) -> Analysis:
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis