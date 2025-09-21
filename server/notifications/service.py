from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from .models import Notification
from .schemas import CreateNotificationRequest, UpdateNotificationRequest
from auth.models import User
import math

class NotificationService:
    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user

    def get_notifications(self, page: int = 1, limit: int = 10, type: Optional[str] = None, 
                         status: Optional[str] = None, query: Optional[str] = None,
                         date_range: Optional[str] = None) -> dict:
        q = self.db.query(Notification).filter(Notification.user_id == self.current_user.id)
        
        if query:
            q = q.filter(or_(
                Notification.title.ilike(f"%{query}%"),
                Notification.message.ilike(f"%{query}%")
            ))
        
        if type and type != "all":
            q = q.filter(Notification.type == type)
        
        if status == "read":
            q = q.filter(Notification.is_read == True)
        elif status == "unread":
            q = q.filter(Notification.is_read == False)
        
        if date_range and date_range != "all":
            now = datetime.now()
            if date_range == "today":
                q = q.filter(Notification.created_at >= now.replace(hour=0, minute=0, second=0))
            elif date_range == "week":
                q = q.filter(Notification.created_at >= now - timedelta(days=7))
            elif date_range == "month":
                q = q.filter(Notification.created_at >= now - timedelta(days=30))
        
        total = q.count()
        unread_count = self.db.query(Notification).filter(
            and_(Notification.user_id == self.current_user.id, Notification.is_read == False)
        ).count()
        
        notifications = q.order_by(desc(Notification.created_at)).offset((page - 1) * limit).limit(limit).all()
        
        return {
            "notifications": notifications,
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "limit": limit,
            "total_pages": math.ceil(total / limit)
        }

    def get_unread_count(self) -> int:
        return self.db.query(Notification).filter(
            and_(Notification.user_id == self.current_user.id, Notification.is_read == False)
        ).count()

    def create_notification(self, request: CreateNotificationRequest) -> Notification:
        user_id = int(request.user_id) if request.user_id else self.current_user.id
        notification = Notification(
            title=request.title,
            message=request.message,
            type=request.type,
            action_url=request.action_url,
            action_text=request.action_text,
            user_id=user_id
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_notification(self, notification_id: int) -> Notification:
        notification = self.db.query(Notification).filter(
            and_(Notification.id == notification_id, Notification.user_id == self.current_user.id)
        ).first()
        if not notification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        return notification

    def update_notification(self, notification_id: int, request: UpdateNotificationRequest) -> Notification:
        notification = self.get_notification(notification_id)
        for field, value in request.dict(exclude_unset=True).items():
            setattr(notification, field, value)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def delete_notification(self, notification_id: int) -> None:
        notification = self.get_notification(notification_id)
        self.db.delete(notification)
        self.db.commit()

    def mark_as_read(self, notification_id: int) -> None:
        notification = self.get_notification(notification_id)
        notification.is_read = True
        self.db.commit()

    def mark_all_as_read(self) -> None:
        self.db.query(Notification).filter(
            and_(Notification.user_id == self.current_user.id, Notification.is_read == False)
        ).update({"is_read": True})
        self.db.commit()

    def bulk_delete(self, ids: List[str]) -> None:
        id_ints = [int(id) for id in ids]
        self.db.query(Notification).filter(
            and_(Notification.id.in_(id_ints), Notification.user_id == self.current_user.id)
        ).delete(synchronize_session=False)
        self.db.commit()