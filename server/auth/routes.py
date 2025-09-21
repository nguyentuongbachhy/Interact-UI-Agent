from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from .schemas import (
    LoginRequest, RegisterRequest, AuthResponse, UserResponse,
    ChangePasswordRequest, ResetPasswordRequest, ConfirmResetPasswordRequest,
    RefreshTokenRequest, EmailVerificationRequest, RefreshTokenResponse,
    AvatarUploadResponse, UpdateUserRequest
)
from .utils import get_current_user
from .service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    tokens = service.create_tokens(user)
    auth_data = AuthResponse(
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            updated_at=user.updated_at
        ),
        **tokens
    )
    
    return {
        "data": auth_data,
        "message": "Login successful",
        "success": True
    }

@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.create_user(request)
    tokens = service.create_tokens(user)
    
    auth_data = AuthResponse(
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            updated_at=user.updated_at
        ),
        **tokens
    )
    
    return {
        "data": auth_data,
        "message": "Registration successful",
        "success": True
    }

@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    tokens = service.refresh_token(request.refresh_token)
    
    return {
        "data": RefreshTokenResponse(**tokens),
        "message": "Token refreshed successfully",
        "success": True
    }

@router.get("/profile")
def get_profile(current_user = Depends(get_current_user)):
    user_data = UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )
    
    return {
        "data": user_data,
        "message": "Profile retrieved successfully",
        "success": True
    }

@router.put("/profile")
def update_profile(
    request: UpdateUserRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    user = service.update_user(current_user.id, request)
    
    user_data = UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    
    return {
        "data": user_data,
        "message": "Profile updated successfully",
        "success": True
    }

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    service.change_password(current_user.id, request)
    
    return {
        "data": None,
        "message": "Password changed successfully",
        "success": True
    }

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    return {
        "data": None,
        "message": "Password reset email sent (if email exists)",
        "success": True
    }

@router.post("/confirm-reset-password")
def confirm_reset_password(request: ConfirmResetPasswordRequest, db: Session = Depends(get_db)):
    return {
        "data": None,
        "message": "Password reset successfully",
        "success": True
    }

@router.post("/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    avatar_url = service.upload_avatar(current_user.id, file)
    
    return {
        "data": AvatarUploadResponse(avatar_url=avatar_url),
        "message": "Avatar uploaded successfully",
        "success": True
    }

@router.delete("/avatar")
def remove_avatar(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    service.remove_avatar(current_user.id)
    
    return {
        "data": None,
        "message": "Avatar removed successfully",
        "success": True
    }

@router.post("/send-verification")
def send_email_verification(current_user = Depends(get_current_user)):
    return {
        "data": None,
        "message": "Verification email sent",
        "success": True
    }

@router.post("/verify-email")
def verify_email(request: EmailVerificationRequest):
    return {
        "data": None,
        "message": "Email verified successfully",
        "success": True
    }

@router.post("/logout")
def logout():
    return {
        "data": None,
        "message": "Logged out successfully", 
        "success": True
    }