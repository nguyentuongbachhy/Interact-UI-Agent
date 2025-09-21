from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr

class ConfirmResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class EmailVerificationRequest(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RefreshTokenResponse(BaseModel):
    token: str
    refresh_token: str

class AvatarUploadResponse(BaseModel):
    avatar_url: str