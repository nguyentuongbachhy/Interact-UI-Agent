from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from auth import get_current_user, User
from .schemas import (
    CreateNotificationRequest,
    UpdateNotificationRequest,
    NotificationResponse,
    NotificationsResponse,
    BulkDeleteRequest,
    NotificationSettings
)
from .service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=dict)
def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    date_range: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    result = service.get_notifications(page, limit, type, status, query, date_range)
    
    notifications_response = [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            message=n.message,
            type=n.type,
            is_read=n.is_read,
            created_at=n.created_at,
            action_url=n.action_url,
            action_text=n.action_text,
            user_id=str(n.user_id)
        ) for n in result["notifications"]
    ]
    
    data = NotificationsResponse(
        notifications=notifications_response,
        total=result["total"],
        unread_count=result["unread_count"],
        page=result["page"],
        limit=result["limit"],
        total_pages=result["total_pages"]
    )
    
    return {"data": data, "message": "Notifications retrieved successfully", "success": True}

@router.get("/unread-count", response_model=dict)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    count = service.get_unread_count()
    return {"data": {"count": count}, "message": "Unread count retrieved", "success": True}

@router.post("", response_model=dict)
def create_notification(
    request: CreateNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    notification = service.create_notification(request)
    
    data = NotificationResponse(
        id=str(notification.id),
        title=notification.title,
        message=notification.message,
        type=notification.type,
        is_read=notification.is_read,
        created_at=notification.created_at,
        action_url=notification.action_url,
        action_text=notification.action_text,
        user_id=str(notification.user_id)
    )
    
    return {"data": data, "message": "Notification created successfully", "success": True}

@router.get("/{notification_id}", response_model=dict)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    notification = service.get_notification(notification_id)
    
    data = NotificationResponse(
        id=str(notification.id),
        title=notification.title,
        message=notification.message,
        type=notification.type,
        is_read=notification.is_read,
        created_at=notification.created_at,
        action_url=notification.action_url,
        action_text=notification.action_text,
        user_id=str(notification.user_id)
    )
    
    return {"data": data, "message": "Notification retrieved successfully", "success": True}

@router.put("/{notification_id}", response_model=dict)
def update_notification(
    notification_id: int,
    request: UpdateNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    notification = service.update_notification(notification_id, request)
    
    data = NotificationResponse(
        id=str(notification.id),
        title=notification.title,
        message=notification.message,
        type=notification.type,
        is_read=notification.is_read,
        created_at=notification.created_at,
        action_url=notification.action_url,
        action_text=notification.action_text,
        user_id=str(notification.user_id)
    )
    
    return {"data": data, "message": "Notification updated successfully", "success": True}

@router.delete("/{notification_id}", response_model=dict)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    service.delete_notification(notification_id)
    return {"data": None, "message": "Notification deleted successfully", "success": True}

@router.patch("/{notification_id}/read", response_model=dict)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    service.mark_as_read(notification_id)
    return {"data": None, "message": "Notification marked as read", "success": True}

@router.patch("/mark-all-read", response_model=dict)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    service.mark_all_as_read()
    return {"data": None, "message": "All notifications marked as read", "success": True}

@router.post("/bulk-delete", response_model=dict)
def bulk_delete(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = NotificationService(db, current_user)
    service.bulk_delete(request.ids)
    return {"data": None, "message": "Notifications deleted successfully", "success": True}

@router.get("/settings", response_model=dict)
def get_notification_settings(current_user: User = Depends(get_current_user)):
    settings = NotificationSettings()
    return {"data": settings, "message": "Settings retrieved successfully", "success": True}

@router.put("/settings", response_model=dict)
def update_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(get_current_user)
):
    return {"data": settings, "message": "Settings updated successfully", "success": True}