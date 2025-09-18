from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from .schemas import LoginRequest, RegisterRequest, AuthResponse, UserResponse
from .utils import authenticate_user, create_user, create_tokens, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    tokens = create_tokens(user)
    auth_data = AuthResponse(
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
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
    user = create_user(db, request.name, request.email, request.password)
    tokens = create_tokens(user)
    
    auth_data = AuthResponse(
        user=UserResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
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

@router.get("/profile")
def get_profile(current_user = Depends(get_current_user)):
    user_data = UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )
    
    return {
        "data": user_data,
        "message": "Profile retrieved successfully",
        "success": True
    }

@router.post("/logout")
def logout():
    return {
        "data": None,
        "message": "Logged out successfully", 
        "success": True
    }