from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Literal

class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    type: Literal["info", "success", "warning", "error", "system"] = "info"
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    user_id: Optional[str] = None

class UpdateNotificationRequest(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[Literal["info", "success", "warning", "error", "system"]] = None
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    is_read: Optional[bool] = None

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    user_id: str
    
    class Config:
        from_attributes = True

class NotificationsResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    limit: int
    total_pages: int

class BulkDeleteRequest(BaseModel):
    ids: List[str]

class NotificationSettings(BaseModel):
    browser: bool = True
    email: bool = False
    push: bool = False
