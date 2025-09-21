from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from typing import Optional
from datetime import timedelta
import uuid
import shutil
from pathlib import Path

from core import create_access_token, verify_password, get_password_hash, verify_token
from .models import User
from .schemas import CreateUserRequest, UpdateUserRequest, ChangePasswordRequest

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = self.get_user_by_email(email)
        if not user or not verify_password(password, user.password):
            return None
        return user
    
    def create_user(self, request: CreateUserRequest) -> User:
        existing_user = self.get_user_by_email(request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        user = User(
            name=request.name,
            email=request.email,
            password=get_password_hash(request.password)
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update_user(self, user_id: int, request: UpdateUserRequest) -> User:
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        for field, value in request.dict(exclude_unset=True).items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def change_password(self, user_id: int, request: ChangePasswordRequest) -> None:
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not verify_password(request.current_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        if request.new_password != request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New passwords do not match"
            )
        
        user.password = get_password_hash(request.new_password)
        self.db.commit()
    
    def create_tokens(self, user: User) -> dict:
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=30)
        )
        refresh_token = create_access_token(
            data={"sub": user.email, "type": "refresh"},
            expires_delta=timedelta(days=7)
        )
        return {
            "token": access_token,
            "refresh_token": refresh_token
        }
    
    def refresh_token(self, refresh_token: str) -> dict:
        try:
            email = verify_token(refresh_token)
            user = self.get_user_by_email(email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            return self.create_tokens(user)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    
    def upload_avatar(self, user_id: int, file: UploadFile) -> str:
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        upload_dir = Path("uploads/avatars")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_extension = file.filename.split(".")[-1] if file.filename else "jpg"
        filename = f"{user_id}_{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        avatar_url = f"/uploads/avatars/{filename}"
        
        if user.avatar_url:
            old_path = Path("." + user.avatar_url)
            if old_path.exists():
                old_path.unlink()
        
        user.avatar_url = avatar_url
        self.db.commit()
        
        return avatar_url
    
    def remove_avatar(self, user_id: int) -> None:
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.avatar_url:
            file_path = Path("." + user.avatar_url)
            if file_path.exists():
                file_path.unlink()
            user.avatar_url = None
            self.db.commit()