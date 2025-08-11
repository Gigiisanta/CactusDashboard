"""
Report management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from cactus_wealth.database import get_db
from cactus_wealth.repositories import ReportRepository

router = APIRouter()


@router.get("/reports")
async def get_reports(db: Session = Depends(get_db)):
    """Get all reports."""
    try:
        report_repo = ReportRepository(db)
        reports = report_repo.get_all()
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/reports/{report_id}")
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """Get a specific report by ID."""
    try:
        report_repo = ReportRepository(db)
        report = report_repo.get_by_id(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/reports/client/{client_id}")
async def get_client_reports(client_id: int, db: Session = Depends(get_db)):
    """Get all reports for a specific client."""
    try:
        report_repo = ReportRepository(db)
        reports = report_repo.get_by_client_id(client_id)
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/reports")
async def create_report(report_data: dict, db: Session = Depends(get_db)):
    """Create a new report."""
    try:
        report_repo = ReportRepository(db)
        report = report_repo.create(report_data)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/reports/{report_id}")
async def delete_report(report_id: int, db: Session = Depends(get_db)):
    """Delete a report."""
    try:
        report_repo = ReportRepository(db)
        success = report_repo.delete(report_id)
        if not success:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"message": "Report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
