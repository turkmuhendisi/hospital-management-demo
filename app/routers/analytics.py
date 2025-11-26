"""
Analytics routes for dashboard charts and statistics
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from ..database import get_db
from ..models import AuditLog

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/activity")
async def get_activity_analytics(
    hospital_id: Optional[str] = Query(None),
    hours: int = Query(24, ge=1, le=168),  # 1 hour to 1 week
    db: Session = Depends(get_db)
):
    """
    Get activity analytics by hour
    Returns event counts for each hour in the specified time range
    """
    # Calculate time range
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Base query
    query = db.query(
        func.strftime('%Y-%m-%d %H:00:00', AuditLog.timestamp).label('hour'),
        func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.timestamp >= start_time
    )
    
    if hospital_id and hospital_id != "all":
        query = query.filter(AuditLog.hospital_id == hospital_id)
    
    # Group by hour
    results = query.group_by('hour').order_by('hour').all()
    
    # Format response
    activity_data = [
        {
            "hour": result.hour,
            "count": result.count
        }
        for result in results
    ]
    
    return activity_data


@router.get("/event-distribution")
async def get_event_distribution(
    hospital_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get distribution of event types
    """
    query = db.query(
        AuditLog.event_type,
        func.count(AuditLog.id).label('count')
    )
    
    if hospital_id and hospital_id != "all":
        query = query.filter(AuditLog.hospital_id == hospital_id)
    
    results = query.group_by(AuditLog.event_type).order_by(desc('count')).limit(20).all()
    
    distribution = [
        {
            "event_type": result.event_type,
            "count": result.count
        }
        for result in results
    ]
    
    return distribution


@router.get("/security")
async def get_security_analytics(
    hospital_id: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """
    Get security-related analytics
    """
    start_time = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(AuditLog).filter(
        AuditLog.timestamp >= start_time,
        (AuditLog.level.in_(["ERROR", "CRITICAL"])) |
        (AuditLog.event_type.like("%SECURITY%")) |
        (AuditLog.event_type.like("%ACCESS_DENIED%"))
    )
    
    if hospital_id and hospital_id != "all":
        query = query.filter(AuditLog.hospital_id == hospital_id)
    
    # Count by severity
    severity_counts = db.query(
        AuditLog.level,
        func.count(AuditLog.id).label('count')
    ).filter(
        AuditLog.timestamp >= start_time,
        AuditLog.level.in_(["ERROR", "CRITICAL", "WARNING"])
    )
    
    if hospital_id and hospital_id != "all":
        severity_counts = severity_counts.filter(AuditLog.hospital_id == hospital_id)
    
    severity_results = severity_counts.group_by(AuditLog.level).all()
    
    return {
        "total_security_events": query.count(),
        "severity_breakdown": [
            {"level": result.level, "count": result.count}
            for result in severity_results
        ],
        "time_range_days": days
    }


@router.get("/performance")
async def get_performance_metrics(
    hospital_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get system performance metrics
    """
    # Events per hour (last 24 hours)
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    events_last_hour = db.query(AuditLog).filter(
        AuditLog.timestamp >= one_hour_ago
    ).count()
    
    # Total events
    total_events = db.query(AuditLog).count()
    
    # Error rate
    total_errors = db.query(AuditLog).filter(
        AuditLog.level.in_(["ERROR", "CRITICAL"])
    ).count()
    
    error_rate = (total_errors / total_events * 100) if total_events > 0 else 0
    
    # Success rate (INFO events)
    success_events = db.query(AuditLog).filter(
        AuditLog.level == "INFO"
    ).count()
    
    success_rate = (success_events / total_events * 100) if total_events > 0 else 0
    
    return {
        "events_per_hour": events_last_hour,
        "total_events": total_events,
        "error_rate": round(error_rate, 2),
        "success_rate": round(success_rate, 2),
        "uptime_percentage": 99.9,  # Simulated
    }


@router.get("/timeline")
async def get_timeline_data(
    hospital_id: Optional[str] = Query(None),
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    """
    Get timeline visualization data
    """
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    query = db.query(AuditLog).filter(
        AuditLog.timestamp >= start_time
    )
    
    if hospital_id and hospital_id != "all":
        query = query.filter(AuditLog.hospital_id == hospital_id)
    
    events = query.order_by(AuditLog.timestamp).all()
    
    timeline = [
        {
            "id": event.id,
            "timestamp": event.timestamp.isoformat(),
            "event_type": event.event_type,
            "level": event.level,
            "message": event.message,
            "user_id": event.user_id,
            "patient_id": event.patient_id,
        }
        for event in events
    ]
    
    return timeline

